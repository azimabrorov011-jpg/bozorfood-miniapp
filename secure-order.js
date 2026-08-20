(() => {
  const SUPABASE_URL='https://uqgckzrmibdgxkxdfzav.supabase.co';
  const SUPABASE_KEY='sb_publishable_KBodwmECQvN46zDKjOwfhg_fet6nBiy';
  const RPC_URL=SUPABASE_URL+'/rest/v1/rpc/create_customer_order';
  function uuid(){
    if(window.crypto && window.crypto.randomUUID)return window.crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,function(c){const r=Math.random()*16|0,v=c==='x'?r:(r&3|8);return v.toString(16);});
  }
  async function createOrder(order,clientRequestId){
    const payload={
      p_shop_code:order.shop_code,p_customer_name:order.customer_name||'',p_phone:order.phone||'',
      p_items:(order.items||[]).map(function(item){return {id:Number(item.id),quantity:Number(item.quantity)};}),
      p_total:Number(order.total||0),p_note:order.note||null,p_delivery_address:order.delivery_address||null,
      p_client_request_id:clientRequestId||uuid()
    };
    const response=await fetch(RPC_URL,{method:'POST',headers:{apikey:SUPABASE_KEY,Authorization:'Bearer '+SUPABASE_KEY,'Content-Type':'application/json',Prefer:'return=representation'},body:JSON.stringify(payload)});
    const raw=await response.text();let data={};try{data=raw?JSON.parse(raw):{};}catch(_){}
    if(!response.ok)throw new Error(data.message||data.error||data.hint||'Buyurtma yuborilmadi');
    return Array.isArray(data)?(data[0]||{}):data;
  }
  window.RastaGoOrderApi={createOrder,uuid};
})();
