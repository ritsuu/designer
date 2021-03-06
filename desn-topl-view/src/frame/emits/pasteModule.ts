/**
 * MyBricks Opensource
 * https://mybricks.world
 * This source code is licensed under the MIT license.
 *
 * CheMingjun @2019
 * mailTo:mybricks@126.com wechatID:ALJZJZ
 */
import FrameModel from "../FrameModel";
import {ToplComModel} from "../../com/ToplComModel";
import {PinModel} from "../../pin/PinModel";
import {ComSeedModel, NS_XGraphComLib} from "@sdk";
import {ModuleModel} from "../../com/module/ModuleModel";
import {JointModel} from "../../joint/JointModel";
import {ConModel} from "../../con/ConModel";
import {alignToCanvasGrid} from "../../ToplUtil";
import {Arrays} from "@utils";
import {ToplViewContext} from "../ToplView";
import DiagramModel from "../diagram/DiagramModel";
import ToplComModelForked from "../../com/ToplComModelForked";

let tvContext: ToplViewContext
let COM_ID_MAPS

export default function pasteModule(json, _tvContext: ToplViewContext): boolean {
  tvContext = _tvContext
  COM_ID_MAPS = json['_COM_ID_MAPS']

  const module = createModule(json)

  if (_tvContext.frameModel.state.isEnabled()) {
    setTimeout(v => {
      _tvContext.emitItem.focus(module)
    })
  }

  return module.id
}

function createModule(json): ModuleModel {
  const refs: { proxyPins: { pin: PinModel, proxy: { id: string } }[] } = {
    proxyPins: []
  }

  const comBaseModel = json['_baseModel'] as ComSeedModel
  //const comDef = context.getComDef(comBaseModel.runtime.def)

  const nmodel: ModuleModel = new ModuleModel(comBaseModel)

  nmodel.runtime.title = json.title

  createFrames(json, nmodel, refs)
  doToplProps(json, nmodel, refs)

  nmodel.parent = tvContext.frameModel
  nmodel.runtime.topl = nmodel

  tvContext.frameModel.addComponent(nmodel)

  refs.proxyPins.forEach(({pin, proxy}) => {
    if (pin.isDirectionOfInput()) {
      let ppin = Arrays.find(pin => pin.id === proxy.id, ...nmodel.getInputsAll())
      if (!ppin) {
        if (nmodel.frames) {
          nmodel.frames.find(frame => {
            if (ppin = frame.inputPins.find(pin => pin.id === proxy.id)) {
              return true
            }
          })
        }
      }
      if (!ppin) {
        throw new Error(`?????????proxyPin,????????????.`)
      }
      pin.proxyPin = ppin
    } else {
      let ppin = Arrays.find(pin => pin.id === proxy.id, ...nmodel.getOutputsAll())
      if (!ppin) {
        if (nmodel.frames) {
          nmodel.frames.find(frame => {
            if (ppin = frame.outputPins.find(pin => pin.id === proxy.id)) {
              return true
            }
          })
        }
      }
      if (!ppin) {
        throw new Error(`?????????proxyPin,????????????.`)
      }
      pin.proxyPin = ppin
    }
  })

  return nmodel
}

function createTopl(json, frameModel: FrameModel, topOne?): ToplComModel {
  const refs: { proxyPins: { pin: PinModel, proxy: { id: string } }[] } = {
    proxyPins: []
  }

  const comBaseModel = json['_baseModel'] as ComSeedModel
  //const comDef = context.getComDef(comBaseModel.runtime.def)

  let nmodel: ToplComModel

  if (comBaseModel.runtime.def.namespace === NS_XGraphComLib.coms.module) {
    nmodel = new ModuleModel(comBaseModel)
  } else {
    nmodel = new ToplComModel(comBaseModel)
  }

  nmodel.runtime.title = json.title

  createFrames(json, nmodel, refs)
  doToplProps(json, nmodel, refs)
// if(json.def.namespace.endsWith('toolbar')){
//   debugger
// }
  nmodel.parent = frameModel
  nmodel.runtime.topl = nmodel

  if (topOne) {
    nmodel.style.left = alignToCanvasGrid(100 + Math.random() * 100)
    nmodel.style.top = alignToCanvasGrid(100 + Math.random() * 100)
  }

  frameModel.addComponent(nmodel)

  refs.proxyPins.forEach(({pin, proxy}) => {
    if (pin.isDirectionOfInput()) {
      let ppin = Arrays.find(pin => pin.id === proxy.id, ...nmodel.getInputsAll())
      if (!ppin) {
        if (nmodel.frames) {
          nmodel.frames.find(frame => {
            if (ppin = frame.inputPins.find(pin => pin.id === proxy.id)) {
              return true
            }
          })
        }
      }
      if (!ppin) {
        throw new Error(`?????????proxyPin,????????????.`)
      }
      pin.proxyPin = ppin
    } else {
      let ppin = Arrays.find(pin => pin.id === proxy.id, ...nmodel.getOutputsAll())
      if (!ppin) {
        if (nmodel.frames) {
          nmodel.frames.find(frame => {
            if (ppin = frame.outputPins.find(pin => pin.id === proxy.id)) {
              return true
            }
          })
        }
      }
      if (!ppin) {
        throw new Error(`?????????proxyPin,????????????.`)
      }
      pin.proxyPin = ppin
    }
  })
  return nmodel
}


function doToplProps(json, gmodel: ToplComModel, refs) {
  const toplJson = json['topl']

  if (toplJson) {
    if (Array.isArray(toplJson.inputPinsInModel)) {
      toplJson.inputPinsInModel.forEach(pin => {
        //const pinModel = gmodel.addInputPinInModel(pin.hostId, pin.title, pin.schema,pin.deletable)///TODO recover
        const pinModel = gmodel.addInputPinInModel(pin.hostId, pin.title, pin.schema, true)
        if (pinModel) {
          pinModel.id = pin.id

          if (pin.proxyPin) {
            refs.proxyPins.push({pin: pinModel, proxy: pin.proxyPin})
          }
        }
      })
    }
    if (Array.isArray(toplJson.outputPinsInModel)) {
      toplJson.outputPinsInModel.forEach(pin => {

        const comBaseModel = json['_baseModel'] as ComSeedModel

        // if(comBaseModel.runtime.def.namespace.endsWith('toolbar')){
        //   debugger
        // }

        //const pinModel = gmodel.addOutputPinInModel(pin.hostId, pin.title, pin.schema,pin.deletable)///TODO recover
        const pinModel = gmodel.addOutputPinInModel(pin.hostId, pin.title, pin.schema, true)
        if (pinModel) {
          pinModel.id = pin.id

          if (pin.proxyPin) {
            refs.proxyPins.push({pin: pinModel, proxy: pin.proxyPin})
          }
        }
      })
    }

    if (Array.isArray(toplJson.inputPins)) {
      toplJson.inputPins.forEach(pin => {
        const pinModel = gmodel.addInputPin(pin.hostId, pin.title, pin.schema)
        pinModel.id = pin.id

        if (pin.proxyPin) {
          refs.proxyPins.push({pin: pinModel, proxy: pin.proxyPin})
        }
      })
    }
    if (Array.isArray(toplJson.outputPins)) {
      toplJson.outputPins.forEach(pin => {
        const pinModel = gmodel.addOutputPin(pin.hostId, pin.title, pin.schema)
        pinModel.id = pin.id

        if (pin.proxyPin) {
          refs.proxyPins.push({pin: pinModel, proxy: pin.proxyPin})
        }
      })
    }

    if (Array.isArray(toplJson.inputPinExts)) {
      toplJson.inputPinExts.forEach(pin => {
        const pinModel = gmodel.addInputPinExt(pin.hostId, pin.title, pin.schema)
        pinModel.id = pin.id
      })
    }
    if (Array.isArray(toplJson.outputPinExts)) {
      toplJson.outputPinExts.forEach(pin => {
        const pinModel = gmodel.addOutputPinExt(pin.hostId, pin.title, pin.schema)
        pinModel.id = pin.id
      })
    }

    if (toplJson.style) {
      for (let key in toplJson.style) {
        gmodel.style[key] = toplJson.style[key]
      }
    }
  }
}

function createFrames(json, gmodel: ToplComModel, refs) {
  if (json.topl && json.topl.frames) {
    let framesJson = json.topl.frames
    if (gmodel.runtime.def.namespace === NS_XGraphComLib.coms.module) {
      if (framesJson.length > 1) {
        framesJson = framesJson.map((frame, idx) => {//Remove empty frames
          if ((!frame.comAry || frame.comAry.length <= 0)
            && (!frame.inputPins || frame.inputPins.length <= 0)
            && (!frame.outputPins || frame.outputPins.length <= 0)) {
            return void 0
          } else {
            return frame
          }
        }).filter(slot => slot)
      }
    }

    gmodel.frames = []
    framesJson.forEach(frameJson => {
      if (frameJson.type !== 'scope') {
        if (Array.isArray(frameJson.comAry)) {
          frameJson.comAry.forEach(json => {
            createTopl(json, tvContext.frameModel)
          })
        }
        return
      }

      const frameModel = gmodel.addFrame(frameJson.id, frameJson.title, frameJson.name, frameJson._rootF)
      frameModel.type = 'scope'

      if (frameJson.style) {
        for (let key in frameJson.style) {
          frameModel.style[key] = frameJson.style[key]
        }
      }

      if (Array.isArray(frameJson.comAry)) {
        frameJson.comAry.forEach(json => {
          createTopl(json, frameModel)
        })
      }

      if (Array.isArray(frameJson.inputPins)) {
        frameJson.inputPins.forEach(pin => {
          const pinModel = frameModel.addInputPin(pin.hostId, pin.title, pin.schema, pin.conMax, pin.deletable)
          pinModel.id = pin.id

          if (pin.proxyPin) {
            refs.proxyPins.push({pin: pinModel, proxy: pin.proxyPin})
          }
        })
      }

      if (Array.isArray(frameJson.outputPins)) {
        frameJson.outputPins.forEach(pin => {
          const pinModel = frameModel.addOutputPin(pin.hostId, pin.title, pin.schema, pin.conMax, pin.deletable)
          pinModel.id = pin.id

          if (pin.proxyPin) {
            refs.proxyPins.push({pin: pinModel, proxy: pin.proxyPin})
          }
        })
      }

      if (Array.isArray(frameJson.inputJoints)) {
        frameJson.inputJoints.forEach(joint => {
          const jointModel = frameModel.addInputJoint()
          for (const key in joint) {
            jointModel[key] = joint[key]
          }
        })
      }

      if (Array.isArray(frameJson.outputJoints)) {
        frameJson.outputJoints.forEach(joint => {
          const jointModel = frameModel.addOutputJoint()
          for (const key in joint) {
            jointModel[key] = joint[key]
          }
        })
      }

      if (Array.isArray(frameJson.diagramAry)) {
        setTimeout(v => {
          const todoCon = []
          frameJson.diagramAry.forEach(diagramJson => {
            let diagramModel: DiagramModel
            if (diagramJson.startCom) {
              const nowId = COM_ID_MAPS[diagramJson.startCom.id]
              const forkFromCom = tvContext.frameModel.searchCom(nowId)
              if (!forkFromCom) {
                throw new Error(`Error occured.`)
              }
              diagramModel = new DiagramModel(frameModel, forkFromCom)
              diagramModel.startFrom._key = diagramJson.startCom._key
              diagramModel.startFrom.synchronizeOutputs()
            } else {
              diagramModel = new DiagramModel(frameModel)
            }

            if (diagramJson.showIO) {
              diagramModel.showIO = true
            }

            diagramModel.style = diagramJson.style

            diagramModel.parent = frameModel
            frameModel.diagramAry.push(diagramModel)

            if (Array.isArray(diagramJson.comAry)) {
              diagramJson.comAry.forEach(objOrId => {
                if (typeof objOrId === 'string') {//comId
                  const nowId = COM_ID_MAPS[objOrId]
                  const toplComModel = tvContext.frameModel.searchCom(nowId)
                  if (!toplComModel) {
                    throw new Error(`Error occured.`)
                  }

                  diagramModel.addCom(toplComModel, {x: toplComModel.style.left, y: toplComModel.style.top})
                } else {//ForkedCom
                  if (!diagramJson.startCom || diagramJson.startCom.id !== objOrId.id) {
                    const nowId = COM_ID_MAPS[objOrId.id]
                    const toplComModel = frameModel.searchCom(nowId)
                    if (!toplComModel) {
                      throw new Error(`Error occured.`)
                    }
                    const style = objOrId.topl.style
                    const forkedCom = diagramModel.addCom(toplComModel, {
                      x: style.left,
                      y: style.top
                    }, objOrId.topl.io) as ToplComModelForked
                    forkedCom._key = objOrId._key
                    forkedCom.synchronizeInputs()
                    forkedCom.synchronizeOutputs()
                  }
                }
              })
            }

            todoCon.push(v => {
              diagramJson.conAry.forEach(con => {
                const {from, to, _points, _startPo, _finishPo, errorInfo} = con

                const {type: fromType, parent: fromParent} = from
                const {type: toType, parent: toParent} = to

                const conTitle = `???${fromParent.comNS}|${from.title || '????????????'} ??? ${toParent.comNS}|${to.title || '????????????'} ?????????`

                let fromCom, toCom
                try {
                  let nowId

                  if (fromParent.comNS === NS_XGraphComLib.coms.module) {
                    fromCom = diagramModel.parent.parent
                  } else {
                    if (fromParent._key) {
                      fromCom = diagramModel.searchComByKey(fromParent._key)
                      // if(!fromCom){
                      //   debugger
                      // }
                    } else {
                      nowId = COM_ID_MAPS[fromParent.comId]
                      if (nowId) {
                        fromCom = diagramModel.searchCom(nowId)
                        if (!fromCom) {
                          throw new Error(`${conTitle},??????(id=${nowId},namespace=${fromParent.comNS})?????????.`)
                        }
                      } else {
                        throw new Error(`${conTitle},??????(id=${fromParent.comId},namespace=${fromParent.comNS})?????????.`)
                      }
                    }
                  }

                  if (toParent.comNS === NS_XGraphComLib.coms.module) {
                    toCom = diagramModel.parent.parent
                  } else {
                    if (toParent._key) {
                      toCom = diagramModel.searchComByKey(toParent._key)
                    } else {
                      nowId = COM_ID_MAPS[toParent.comId]
                      if (nowId) {
                        toCom = diagramModel.searchCom(nowId)
                        if (!toCom) {
                          throw new Error(`${conTitle},??????(id=${nowId},namespace=${toParent.comNS})?????????.`)
                        }
                      } else {
                        throw new Error(`${conTitle},??????(id=${toParent.comId},namespace=${toParent.comNS})?????????.`)
                      }
                    }
                  }
                } catch (ex) {
                  tvContext.emitLogs.error(ex.message)
                }

                if (!fromCom || !toCom) {
                  return
                }

                let startPin: PinModel | JointModel
                if (fromType === 'pin') {
                  if (fromParent.type === 'com') {
                    startPin = fromCom.searchPinByHostId(from.hostId)
                    if (!startPin) {
                      debugger
                    }
                  } else {
                    const frameT = fromCom.searchFrame(fromParent.id)
                    if (!frameT) {
                      throw new Error(`?????????frame(id=${fromParent.id})`)
                    } else {
                      startPin = frameT.searchPin(from.id)
                    }
                    if (!startPin) {
                      debugger
                    }
                  }
                } else if (fromType === 'joint') {
                  const frameT = fromCom.searchFrame(fromParent.id)
                  if (!frameT) {
                    throw new Error(`?????????frame(id=${fromParent.id})`)
                  } else {
                    startPin = frameT.searchJoint(from.id)
                  }
                }

                let finishPin: PinModel | JointModel

                if (toType === 'pin') {
                  if (toParent.type === 'com') {
                    finishPin = toCom.searchPinByHostId(to.hostId)
                    //finishPin = toCom.searchPin(to.id)
                  } else {
                    const frameT = toCom.searchFrame(toParent.id)
                    if (!frameT) {
                      throw new Error(`?????????frame(id=${toParent.id})`)
                    } else {
                      finishPin = frameT.searchPin(to.id)
                    }
                  }
                } else if (toType === 'joint') {
                  const frameT = toCom.searchFrame(toParent.id)
                  if (!frameT) {
                    throw new Error(`?????????frame(id=${toParent.id})`)
                  } else {
                    finishPin = frameT.searchJoint(to.id)
                  }
                }

                // let startPin: PinModel | JointModel = frame.searchPin(from.id)
                // if (!startPin) {
                //   startPin = frame.searchJoint(from.id)
                // }
                // let finishPin: PinModel | JointModel = frame.searchPin(to.id)
                // if (!finishPin) {
                //   finishPin = frame.searchJoint(to.id)
                // }

                if (startPin && finishPin) {
                  const conModel = new ConModel({startPin, finishPin, _points, _startPo, _finishPo, errorInfo})
                  conModel.parent = diagramModel

                  if (startPin instanceof PinModel) {
                    startPin.addCon(conModel)
                  } else {
                    startPin.to = conModel
                  }

                  if (finishPin instanceof PinModel) {
                    finishPin.addCon(conModel)
                  } else {
                    finishPin.from = conModel
                  }

                  diagramModel.addConnection(conModel)
                } else {
                  debugger
                }
              })
            })
          })

          setTimeout(v => {
            todoCon.forEach(con => con())
          })
        })
      }
    })
  }
}