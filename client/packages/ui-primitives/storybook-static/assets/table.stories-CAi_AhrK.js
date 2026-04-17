import{j as e}from"./jsx-runtime-BjG_zV1W.js";import{c as l}from"./utils-BQHNewu7.js";function r({className:a,...t}){return e.jsx("div",{"data-slot":"table-container",className:"relative w-full overflow-x-auto",children:e.jsx("table",{"data-slot":"table",className:l("w-full caption-bottom text-sm",a),...t})})}function x({className:a,...t}){return e.jsx("thead",{"data-slot":"table-header",className:l("[&_tr]:border-b",a),...t})}function u({className:a,...t}){return e.jsx("tbody",{"data-slot":"table-body",className:l("[&_tr:last-child]:border-0",a),...t})}function h({className:a,...t}){return e.jsx("tfoot",{"data-slot":"table-footer",className:l("border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",a),...t})}function d({className:a,...t}){return e.jsx("tr",{"data-slot":"table-row",className:l("border-b transition-colors hover:bg-muted/50 has-aria-expanded:bg-muted/50 data-[state=selected]:bg-muted",a),...t})}function s({className:a,...t}){return e.jsx("th",{"data-slot":"table-head",className:l("h-10 px-2 text-left align-middle font-medium whitespace-nowrap text-foreground [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",a),...t})}function o({className:a,...t}){return e.jsx("td",{"data-slot":"table-cell",className:l("p-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",a),...t})}function T({className:a,...t}){return e.jsx("caption",{"data-slot":"table-caption",className:l("mt-4 text-sm text-muted-foreground",a),...t})}r.__docgenInfo={description:"",methods:[],displayName:"Table"};x.__docgenInfo={description:"",methods:[],displayName:"TableHeader"};u.__docgenInfo={description:"",methods:[],displayName:"TableBody"};h.__docgenInfo={description:"",methods:[],displayName:"TableFooter"};s.__docgenInfo={description:"",methods:[],displayName:"TableHead"};d.__docgenInfo={description:"",methods:[],displayName:"TableRow"};o.__docgenInfo={description:"",methods:[],displayName:"TableCell"};T.__docgenInfo={description:"",methods:[],displayName:"TableCaption"};const N={title:"Primitives/Table",component:r,parameters:{layout:"centered"},tags:["autodocs"]},i=[{id:"INV001",status:"已支付",method:"信用卡",amount:250},{id:"INV002",status:"待处理",method:"支付宝",amount:150},{id:"INV003",status:"未支付",method:"银行卡",amount:350}],n={render:()=>e.jsxs(r,{children:[e.jsx(T,{children:"近期发票列表"}),e.jsx(x,{children:e.jsxs(d,{children:[e.jsx(s,{className:"w-[100px]",children:"发票号"}),e.jsx(s,{children:"状态"}),e.jsx(s,{children:"支付方式"}),e.jsx(s,{className:"text-right",children:"金额"})]})}),e.jsx(u,{children:i.map(a=>e.jsxs(d,{children:[e.jsx(o,{className:"font-medium",children:a.id}),e.jsx(o,{children:a.status}),e.jsx(o,{children:a.method}),e.jsxs(o,{className:"text-right",children:["¥",a.amount.toFixed(2)]})]},a.id))}),e.jsx(h,{children:e.jsxs(d,{children:[e.jsx(o,{colSpan:3,children:"合计"}),e.jsxs(o,{className:"text-right",children:["¥",i.reduce((a,t)=>a+t.amount,0).toFixed(2)]})]})})]})};var c,m,b;n.parameters={...n.parameters,docs:{...(c=n.parameters)==null?void 0:c.docs,source:{originalSource:`{
  render: () => <Table>
      <TableCaption>近期发票列表</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[100px]">发票号</TableHead>
          <TableHead>状态</TableHead>
          <TableHead>支付方式</TableHead>
          <TableHead className="text-right">金额</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invoices.map(inv => <TableRow key={inv.id}>
            <TableCell className="font-medium">{inv.id}</TableCell>
            <TableCell>{inv.status}</TableCell>
            <TableCell>{inv.method}</TableCell>
            <TableCell className="text-right">¥{inv.amount.toFixed(2)}</TableCell>
          </TableRow>)}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={3}>合计</TableCell>
          <TableCell className="text-right">
            ¥{invoices.reduce((sum, inv) => sum + inv.amount, 0).toFixed(2)}
          </TableCell>
        </TableRow>
      </TableFooter>
    </Table>
}`,...(b=(m=n.parameters)==null?void 0:m.docs)==null?void 0:b.source}}};const j=["Default"];export{n as Default,j as __namedExportsOrder,N as default};
