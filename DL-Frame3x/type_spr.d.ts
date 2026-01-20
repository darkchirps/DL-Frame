import { UIClass } from './assets/appDL/Manager/UIClass';
import { game } from './assets/scripts/ui/game/game';
import { home } from './assets/scripts/ui/home/home';
import { loading } from './assets/scripts/ui/loading/loading';

interface UIClassDict { }
interface gameClass extends UIClass {
    uiScr: game
}
interface homeClass extends UIClass {
    uiScr: home
}
interface loadingClass extends UIClass {
    uiScr: loading
}

interface UIClassDict {
    game: gameClass
    home: homeClass
    loading: loadingClass
}