import { Node } from 'cc';
declare global {
   type tree_home = {
      "home": cc.Node,
      "list": cc.Node,
      "view": cc.Node,
      "content": cc.Node,
      "item": cc.Node,
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