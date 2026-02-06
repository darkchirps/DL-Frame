import { Node } from 'cc';
declare global {
   type tree_game = {
      "game": cc.Node,
      "mapNode": cc.Node,
      "layer": cc.Node,
      "topNode": cc.Node,
      "backBtn": cc.Node,
      "New Label": cc.Node,
      "replayBtn": cc.Node,
      "New Label": cc.Node,
      "bottomNode": cc.Node,
      "propTipBtn": cc.Node,
      "New Label": cc.Node,
      "propRefreshBtn": cc.Node,
      "New Label": cc.Node,
      "propBoomBtn": cc.Node,
      "New Label": cc.Node,
   }
   type tree_gameItem = {
      "gameItem": cc.Node,
      "iconBg": cc.Node,
      "icon": cc.Node,
      "shadow": cc.Node,
      "tip": cc.Node,
   }
   type tree_home = {
      "home": cc.Node,
      "play": cc.Node,
   }
   type tree_loading = {
      "loading": cc.Node,
      "pro": cc.Node,
      "bar": cc.Node,
      "proLab": cc.Node,
   }
   type tree_test = {
      "testUi": cc.Node,
      "pic": cc.Node,
   }
}