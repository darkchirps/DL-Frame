import { Node } from 'cc';
declare global {
   type tree_game = {
      "game": Node,
      "mapNode": Node,
      "mapImg": Node,
   }
   type tree_home = {
      "home": Node,
      "list": Node,
      "view": Node,
      "content": Node,
      "item": Node,
   }
   type tree_loading = {
      "loading": Node,
      "pro": Node,
      "Bar": Node,
      "Label": Node,
   }
}