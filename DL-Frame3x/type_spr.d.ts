import { UIClass } from './assets/appDL/Manager/UIClass';
import { home } from './assets/appScr/home/home';
import { loading } from './assets/appScr/loading/loading';
import { mahLoading } from './assets/mahScr/ui/mahLoading/mahLoading';

interface UIClassDict { }
interface homeClass extends UIClass {
    uiScr: home
}
interface loadingClass extends UIClass {
    uiScr: loading
}
interface mahLoadingClass extends UIClass {
    uiScr: mahLoading
}

interface UIClassDict {
    home: homeClass
    loading: loadingClass
    mahLoading: mahLoadingClass
}