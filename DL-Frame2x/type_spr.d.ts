import { UIClass } from './assets/appDL/Manager/UIClass';
import { home } from './assets/scripts/ui/home/home';
import { loading } from './assets/scripts/ui/loading/loading';
import { test } from './assets/scripts/ui/test/test';

interface UIClassDict { }
interface homeClass extends UIClass {
    uiScr: home
}
interface loadingClass extends UIClass {
    uiScr: loading
}
interface testClass extends UIClass {
    uiScr: test
}

interface UIClassDict {
    home: homeClass
    loading: loadingClass
    test: testClass
}