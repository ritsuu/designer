/**
 * MyBricks Opensource
 * https://mybricks.world
 * This source code is licensed under the MIT license.
 *
 * CheMingjun @2019
 * mailTo:mybricks@126.com wechatID:ALJZJZ
 */

import Ctx from './Ctx'
import {domToImg} from '../utils'
import React, {ReactChild, useState} from 'react';
import {getPosition, versionGreaterThan} from "@utils";
import DownOutlined from '@ant-design/icons/DownOutlined'
import RightOutlined from '@ant-design/icons/RightOutlined'
import CaretRightOutlined from '@ant-design/icons/CaretRightOutlined'
import {evt, dragable, observe, useComputed, useObservable, uuid} from '@mybricks/rxui'
import {ComSeedModel, DesignerContext, NS_Emits, T_XGraphComDef, T_XGraphComLib} from '@sdk'

import css from './ComlibView.less'

let myCtx: Ctx
const moveDomMap: any = {}

export default function ComlibView({mode, model}) {
  const context = observe(DesignerContext, {from: 'parents'})
  const emitSnap = useObservable(NS_Emits.Snap, {expectTo: 'parents'})
  const emitItems = useObservable(NS_Emits.Component, {expectTo: 'parents'})
  const emitLogs = useObservable(NS_Emits.Logs, {expectTo: 'parents'})

  myCtx = useObservable(Ctx, next => next({
    context,
    emitLogs,
    emitSnap,
    emitItems,
    mode,
    model,
    renderedLib: [],
  }), {to: 'children'}, [mode])

  useComputed(() => {
    if (myCtx.context.comLibAry) {
      const optionlibs: { id: string; comAray: any; }[] = []
      myCtx.context.comLibAry.forEach(lib => {
        if (!lib.id) {
          lib.id = uuid()
        }

        if (lib.visible !== false) {
          if (lib.comAray.find(comDef => myCtx.matchCom(comDef))) {////TODO
            lib._visible = true
            lib._expanded = true
            optionlibs.push(lib)
          } else {
            lib._visible = false
          }
        }
      })
    }
  })

  const RenderComlibs = useComputed(() => {
    let comLibAry = myCtx.context.comLibAry ? myCtx.context.comLibAry.filter(comLib => (comLib.visible === void 0 || comLib.visible) && comLib._visible) : []
    return comLibAry.map((comLib, idx) => {
      const title = `${comLib.title}(${comLib.version})`
      const key = `${comLib.id}_${comLib.version}`
      if (!moveDomMap[key]) {
        moveDomMap[key] = {}
      }
      return (
        <div className={css.collapsePanel} key={key}>
          <div className={css.header} onClick={evt(() => {
            comLib._expanded = !comLib._expanded
          }).stop}>
            <CaretRightOutlined className={`${css.arrowIcon} ${comLib._expanded ? css.expandedIcon : ''}`}/>
            <div className={css.title}>
              {title}
            </div>
          </div>
          <div className={css.comLibsContainer} style={{height: comLib._expanded ? '100%' : 0}}>
            {coms(comLib)}
          </div>
          {idx === comLibAry.length - 1 && (
            <div className={css.addComBtn} onClick={addComLib}><span>+</span>添加组件库</div>
          )}
        </div>
      )
    })
  })

  return (
    <div className={`${css.panel}`}
         onClick={evt(null).stop}>
      <div className={css.toolbarLayout}>
        <div className={css.libSelection}>
          {RenderComlibs}
        </div>
      </div>
    </div>
  )
}


async function addComLib() {
  const libDesc = await myCtx.context.configs.comlibAdder()

  if (!libDesc) return

  if (typeof myCtx.context.configs.comlibLoader === 'function') {
    const addedComLib = await myCtx.context.configs.comlibLoader(libDesc)

    if (addedComLib) {
      const exitLib = myCtx.context.comLibAry.find(lib => lib.id === addedComLib.id)
      if (exitLib) {
        if (addedComLib.version === exitLib.version) {
          myCtx.emitLogs.error('组件库更新', `当前项目已存在组件库 ${addedComLib.title}@${addedComLib.version}.`)
          return
        }
        if (versionGreaterThan(addedComLib.version, exitLib.version)) {//update
          const idx = myCtx.context.comLibAry.indexOf(exitLib)
          myCtx.context.comLibAry.splice(idx, 1, addedComLib)
          myCtx.activeLib = addedComLib

          myCtx.emitLogs.info('组件库更新完成', `已将组件库 ${addedComLib.title} 更新到版本 ${addedComLib.version}.`)
        } else {
          myCtx.emitLogs.error('组件库更新失败', `当前项目存在更高版本的组件库.`)
        }
      } else {
        myCtx.context.comLibAry.push(addedComLib)
        const tlib = myCtx.context.comLibAry[myCtx.context.comLibAry.length - 1]
        myCtx.activeLib = tlib
        myCtx.emitLogs.info('组件库添加完成', `已将组件库 ${addedComLib.title}@${addedComLib.version} 添加到当前项目中.`)
      }
    } else {
      myCtx.emitLogs.error('组件库更新失败', `添加组件库${JSON.stringify(libDesc)}失败.`)
    }
  }
}

function renderComItem(lib, com) {
  if (com.enable !== void 0 && com.enable === false) {
    return
  }
  if (com.visibility !== void 0 && com.visibility === false) {
    return
  }
  if (myCtx.matchCom(com)) {
    const isJS = !!(com.rtType && com.rtType.match(/js|ts/gi))
    return (
      <div
        ref={(node) => {
          const libKey = `${lib.id}_${lib.version}`
          if (!moveDomMap[libKey]) return
          
          const comKey = `${com.namespace}_${com.version}`

          if (!moveDomMap[libKey][comKey]) {
            domToImg.toPng(node).then(function (dataUrl: string) {
              var img = new Image();
              img.src = dataUrl;
              img.style.cursor = 'move'
              moveDomMap[libKey][comKey] = img
            }).catch(function (error: Error) {
              console.error(error)
            })
          }
        }}
        key={com.namespace}
        data-namespace={com.namespace}
        className={`${css.comItem} ${isJS ? css.notAllowed : ''}`}
        onMouseDown={evt((et: any) => {
          if (et.target.tagName.match(/input/gi)) {
            return true//TODO input 全局事件待处理
          }
          if (!isJS) {
            mouseDown(et, com, lib)
          }
        })}
        onClick={evt((et: any) => {
          if (et.target.tagName.match(/input/gi)) {
            return true//TODO input 全局事件待处理
          }
          if (!isJS) {
            click(com)
          }
        })}
      >
        <div className={css.widgetIconWrapper}>
          {com.icon === './icon.png' || !/^(https:)/.test(com.icon) ? (
            <div className={css.comIconFallback}>{com.title?.substr(0, 1)}</div>
          ) : (
            <div className={css.img} style={{backgroundImage: `url(${com.icon})`}}></div>
          )}
        </div>
        <div className={css.title}>{com.title}</div>
      </div>
    )
  }
}

function click(com: T_XGraphComDef) {
  const instanceModel = new ComSeedModel({
    namespace: com.namespace,
    version: com.version,
    rtType: com.rtType,
    data: JSON.parse(JSON.stringify(com.data ? com.data : {}))
  })

  const snap = myCtx.emitSnap.start('add component')

  myCtx.emitItems.add(instanceModel, 'finish');

  snap.commit()
}

function mouseDown(evt: any, com: T_XGraphComDef, lib: any) {
  const libKey = `${lib.id}_${lib.version}`

  if (!moveDomMap[libKey]) return

  const comKey = `${com.namespace}_${com.version}`
  const moveDom = moveDomMap[libKey][comKey]

  if (!moveDom) return

  const moveNode = document.createElement('div')

  moveNode.style.position = 'absolute'
  moveNode.style.zIndex = '1000'
  moveNode.style.opacity = '0.3'
  moveNode.style.backgroundColor = '#e1e4e7'
  moveNode.style.border = '1px solid #616C81'
  moveNode.appendChild(moveDom)

  let snap: any
  let viewPo: any
  dragable(evt, ({po: {x, y}, epo: {ex, ey}, dpo: {dx, dy}}: any, state: string) => {
    if (state == 'start') {
      snap = myCtx.emitSnap.start('add component')
      viewPo = getPosition(myCtx.model.getCurModule().slot.$el)
      document.body.appendChild(moveNode)
      moveNode.style.top = `${y}px`
      moveNode.style.left = `${x}px`
      moveNode.style.display = 'block'
      return
    }
    if (state == 'moving') {
      moveNode.style.top = `${y + dy}px`
      moveNode.style.left = `${x + dx}px`
      move({state: 'ing', ex: ex + viewPo.x, ey: ey + viewPo.y, com, lib})
    }
    if (state == 'finish') {
      document.body.removeChild(moveNode)
      move({state: 'finish', ex: ex + viewPo.x, ey: ey + viewPo.y, com, lib})
      snap.commit()
    }
  })
}

function move({state, ex, ey, com, lib}: {state: 'ing' | 'finish' | 'cancel', ex: number, ey: number, com: T_XGraphComDef, lib: any}) {
  const instanceModel = new ComSeedModel(
    {
      namespace: com.namespace,
      libId: lib.id,
      style: {left: ex, top: ey},
      data: JSON.parse(JSON.stringify(com.data ? com.data : {}))
    }
  )

  myCtx.emitItems.add(instanceModel, state);
}

function getCurrentNode(e: any): Node {
  if ((e && /comItem/.test(e.className)) || (e.target && /comItem/.test(e.target.className))) {
    return e.target || e
  } else {
    return getCurrentNode(e.parentNode || e.target.parentNode)
  }
}

export function getInputs() {
  return new Proxy({}, {
    get(target: {}, _id: PropertyKey, receiver: any): any {
      return function () {
      }
    }
  })
}

export function getOutputs() {
  return new Proxy({}, {
    get(target: {}, _id: PropertyKey, receiver: any): any {
      return function (data: any) {
      }
    }
  })
}

function ExpandableCatalog({name, children}: { name: string, children: ReactChild }) {
  const [isExpand, setExpand] = useState(true)
  const hide = myCtx.activeCatalog && myCtx.activeCatalog !== name // 隐藏未被选中分类
  return (
    <div key={name} className={css.catalog} style={hide ? {display: 'none'} : {}}>
      <div className={css.cataTitle} onClick={() => setExpand(!isExpand)}>
        <span className={css.cataTitleText}>{name}</span>
        {
          isExpand
            ? <DownOutlined style={{color: '#fa6400'}}/>
            : <RightOutlined style={{color: '#fa6400'}}/>
        }
      </div>
      <div className={css.coms} style={{display: isExpand ? 'block' : 'none'}}>
        {children}
      </div>
    </div>
  )
}

function coms(comLib: T_XGraphComLib) {
  const rdLib = []
  let ary = []
  let noCatalogAry: JSX.Element[] = []
  let hasCatalog = false
  comLib.comAray.forEach((com) => {
    const renderedItem = renderComItem(comLib, com)
    renderedItem && noCatalogAry.push(renderedItem)
  })

  if (noCatalogAry.length > 0) {
    let noCatalogComs = (
      <div key={'noCatalog'} className={css.basicList}>
        {noCatalogAry}
      </div>
    )
    if (hasCatalog) {
      noCatalogComs = (
        <ExpandableCatalog key="others" name="其它">
          <>{noCatalogComs}</>
        </ExpandableCatalog>
      )
    }
    ary.push(noCatalogComs)
  }

  rdLib.push(
    {id: comLib.id, content: ary}
  )

  return rdLib.map(({id, content}, idx) => {
    return (
      <div key={id}>
        {content}
      </div>
    )
  })
}