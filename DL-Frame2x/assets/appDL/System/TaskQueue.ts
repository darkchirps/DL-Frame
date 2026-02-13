/**
 * 任务状态枚举
 */
export enum TaskStatus {
    PENDING = 'pending',      // 等待中
    RUNNING = 'running',      // 执行中
    COMPLETED = 'completed',  // 已完成
    FAILED = 'failed'         // 失败
}

/**
 * 任务函数类型
 */
export type TaskFunction = () => Promise<any> | any;

/**
 * 任务接口
 */
export interface Task {
    id?: string;                    // 任务ID
    name: string;                   // 任务名称
    execute: TaskFunction;          // 执行函数
    priority?: number;              // 优先级（数字越小优先级越高）
    status?: TaskStatus;            // 任务状态
    condition?: () => boolean;      // 执行条件
    stopOnError?: boolean;          // 出错时是否停止队列
    data?: any;                     // 任务数据
    error?: any;                    // 错误信息
    createdAt?: number;             // 创建时间
    timeout?: number;               // 超时时间（毫秒）
}
/**
 * 任务队列 - 顺序执行异步任务
 * 只有前一个任务完成后才会开始下一个任务
 */
export class TaskQueue {
    private queue: Task[] = [];
    private isRunning: boolean = false;
    private isPaused: boolean = false;
    private currentTask: Task | null = null;

    // 队列状态事件回调
    public onTaskStart?: (task: Task) => void;
    public onTaskComplete?: (task: Task, result: any) => void;
    public onTaskError?: (task: Task, error: any) => void;
    public onQueueComplete?: () => void;
    public onQueueEmpty?: () => void;

    constructor() { }

    /**
     * 添加任务到队列
     * @param task 任务函数或Task对象
     * @param name 任务名称（可选）
     * @param priority 优先级（数字越小优先级越高）
     */
    public add(task: TaskFunction | Task, name?: string, priority: number = 0): this {
        let taskObj: Task;
        if (typeof task === 'function') {
            taskObj = {
                id: this.generateId(),
                name: name || `task_${this.queue.length + 1}`,
                execute: task,
                priority,
                status: TaskStatus.PENDING,
                createdAt: Date.now()
            };
        } else {
            taskObj = {
                ...task,
                id: task.id || this.generateId(),
                name: task.name || name || `task_${this.queue.length + 1}`,
                status: TaskStatus.PENDING
            };
        }
        // 按优先级插入队列
        this.insertByPriority(taskObj);
        // 如果队列没有运行，则启动
        if (!this.isRunning && !this.isPaused) {
            this.start();
        }
        return this;
    }

    /**
     * 批量添加任务
     */
    public addBatch(tasks: Array<TaskFunction | Task>): this {
        tasks.forEach(task => this.add(task));
        return this;
    }

    /**
     * 开始执行队列
     */
    public async start(): Promise<void> {
        if (this.isRunning || this.isPaused) return;
        this.isRunning = true;
        while (this.queue.length > 0 && !this.isPaused) {
            // 获取下一个任务（按优先级）
            const nextTask = this.queue.shift();
            if (!nextTask) break;
            this.currentTask = nextTask;
            this.currentTask.status = TaskStatus.RUNNING;
            // 触发任务开始事件
            this.onTaskStart?.(this.currentTask);
            try {
                // 执行任务
                const result = await this.executeTask(this.currentTask);
                // 任务成功完成
                this.currentTask.status = TaskStatus.COMPLETED;
                this.onTaskComplete?.(this.currentTask, result);

            } catch (error) {
                // 任务执行失败
                this.currentTask.status = TaskStatus.FAILED;
                this.currentTask.error = error;
                this.onTaskError?.(this.currentTask, error);
                // 根据配置决定是否继续执行后续任务
                if (this.currentTask.stopOnError) {
                    this.clear();
                    this.isRunning = false;
                    return;
                }
            } finally {
                this.currentTask = null;
            }
        }
        // 队列执行完成
        this.isRunning = false;
        if (this.queue.length === 0) {
            this.onQueueEmpty?.();
        }
        this.onQueueComplete?.();
    }

    /**
     * 暂停队列执行
     */
    public pause(): void {
        this.isPaused = true;
    }

    /**
     * 恢复队列执行
     */
    public resume(): void {
        if (!this.isPaused) return;
        this.isPaused = false;
        if (!this.isRunning && this.queue.length > 0) {
            this.start();
        }
    }

    /**
     * 清空队列
     */
    public clear(): void {
        this.queue = [];
        this.currentTask = null;
    }

    /**
     * 获取队列长度
     */
    public get length(): number {
        return this.queue.length;
    }

    /**
     * 获取运行状态
     */
    public get running(): boolean {
        return this.isRunning;
    }

    /**
     * 获取暂停状态
     */
    public get paused(): boolean {
        return this.isPaused;
    }

    /**
     * 获取当前执行的任务
     */
    public get current(): Task | null {
        return this.currentTask;
    }

    /**
     * 获取队列中的所有任务
     */
    public get tasks(): Task[] {
        return [...this.queue];
    }

    /**
     * 按优先级插入任务
     */
    private insertByPriority(task: Task): void {
        let index = 0;
        // 找到第一个优先级小于当前任务的位置
        while (index < this.queue.length && this.queue[index].priority <= task.priority) {
            index++;
        }
        this.queue.splice(index, 0, task);
    }

    /**
     * 执行单个任务
     */
    private async executeTask(task: Task): Promise<any> {
        // 如果有前置条件，先检查
        if (task.condition && !task.condition()) {
            throw new Error(`Task "${task.name}" condition not met`);
        }
        // 执行任务函数
        return await task.execute();
    }

    /**
     * 生成任务ID
     */
    private generateId(): string {
        return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}