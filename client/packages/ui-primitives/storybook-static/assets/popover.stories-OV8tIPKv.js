import{j as e}from"./jsx-runtime-BjG_zV1W.js";import{c}from"./utils-BQHNewu7.js";import{R as u,T as f,P as g,C as v}from"./index-tTUmRSZg.js";import"./index-B3e6rcmj.js";import"./_commonjsHelpers-Cpj98o6Y.js";import"./index-DclwlaNk.js";import"./index-BAgrSUEs.js";import"./index-DuVyFFjR.js";import"./index-CnCkN4Kb.js";import"./index-Tk7B4GT7.js";import"./index-JG1J0hlI.js";import"./index-CLFlh7pk.js";import"./index-D8RfjXkI.js";import"./index-CXzmB-r4.js";import"./index-BVSSuIN4.js";import"./index-D61X6AnJ.js";import"./index-npCAFBsl.js";import"./index-BsSyydlo.js";function r({...o}){return e.jsx(u,{"data-slot":"popover",...o})}function d({...o}){return e.jsx(f,{"data-slot":"popover-trigger",...o})}function i({className:o,align:p="center",sideOffset:m=4,...l}){return e.jsx(g,{children:e.jsx(v,{"data-slot":"popover-content",align:p,sideOffset:m,className:c("z-50 w-72 origin-(--radix-popover-content-transform-origin) rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-hidden data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",o),...l})})}r.__docgenInfo={description:"",methods:[],displayName:"Popover"};d.__docgenInfo={description:"",methods:[],displayName:"PopoverTrigger"};i.__docgenInfo={description:"",methods:[],displayName:"PopoverContent",props:{align:{defaultValue:{value:"'center'",computed:!1},required:!1},sideOffset:{defaultValue:{value:"4",computed:!1},required:!1}}};const V={title:"Primitives/Popover",component:r,parameters:{layout:"centered"},tags:["autodocs"]},t={render:()=>e.jsxs(r,{children:[e.jsx(d,{asChild:!0,children:e.jsx("button",{type:"button",className:"rounded-md border px-4 py-2 text-sm",children:"打开弹出框"})}),e.jsx(i,{children:e.jsx("div",{className:"grid gap-4",children:e.jsxs("div",{className:"space-y-2",children:[e.jsx("h4",{className:"font-medium leading-none",children:"尺寸设置"}),e.jsx("p",{className:"text-sm text-muted-foreground",children:"调整组件的宽度和高度。"})]})})})]})};var a,n,s;t.parameters={...t.parameters,docs:{...(a=t.parameters)==null?void 0:a.docs,source:{originalSource:`{
  render: () => <Popover>
      <PopoverTrigger asChild>
        <button type="button" className="rounded-md border px-4 py-2 text-sm">
          打开弹出框
        </button>
      </PopoverTrigger>
      <PopoverContent>
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">尺寸设置</h4>
            <p className="text-sm text-muted-foreground">调整组件的宽度和高度。</p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
}`,...(s=(n=t.parameters)==null?void 0:n.docs)==null?void 0:s.source}}};const S=["Default"];export{t as Default,S as __namedExportsOrder,V as default};
