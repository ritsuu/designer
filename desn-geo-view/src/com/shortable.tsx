import {NS_Configurable} from "@sdk";
import {ComContext} from "./GeoCom";

import {get as getConfigurable} from "./configrable";

//Record for current active editor array

export function get(comContext: ComContext) {
  const configs = getConfigurable(comContext)
  const shortcuts = configs.map(catelog => {
    catelog.groups && (catelog.groups.forEach(group => {
      group.items && (group.items = group.items.filter(item => item.sameAsShortcut))
    }))
    return catelog
  })

  debugger

  return shortcuts
}
