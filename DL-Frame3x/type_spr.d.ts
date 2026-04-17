import { UIClass } from './assets/appDL/Manager/UIClass';
import { home } from './assets/appScr/home/home';
import { loading } from './assets/appScr/loading/loading';

interface UIClassDict { }
interface homeClass extends UIClass {
    uiScr: home
}
interface loadingClass extends UIClass {
    uiScr: loading
}

interface UIClassDict {
    home: homeClass
    loading: loadingClass
}