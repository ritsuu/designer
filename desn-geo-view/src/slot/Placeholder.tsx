import css from "./Placeholder.less";
import React from "react";
import {observe, useObservable} from "@mybricks/rxui";
import {GeoViewContext} from "./GeoView";

export default function Placeholder() {
  const {placeholder} = observe(GeoViewContext, {from: 'parents'})
  return placeholder && (
    <div className={`${css.placeholder} ${placeholder.type === 'h' ? css.placeholderH : css.placeholderV}`}
         style={{
           display: `${placeholder.y !== void 0 ? 'block' : 'none'}`,
           top: placeholder.y,
           left: placeholder.x,
           height: placeholder.h,
           width: placeholder.w
         }}>
      <div/>
    </div>
  )
}