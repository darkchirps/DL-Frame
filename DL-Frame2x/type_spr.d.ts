import { UIClass } from './assets/appDL/Manager/UIClass';
import { game } from './assets/scripts/ui/game/game';
import { gameItem } from './assets/scripts/ui/game/gameItem';
import { gameMap } from './assets/scripts/ui/game/gameMap';
import { home } from './assets/scripts/ui/home/home';
import { loading } from './assets/scripts/ui/loading/loading';
import { test } from './assets/scripts/ui/test/test';

interface UIClassDict { }
interface gameClass extends UIClass {
    uiScr: game
}
interface gameItemClass extends UIClass {
    uiScr: gameItem
}
interface gameMapClass extends UIClass {
    uiScr: gameMap
}
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
    game: gameClass
    gameItem: gameItemClass
    gameMap: gameMapClass
    home: homeClass
    loading: loadingClass
    test: testClass
}