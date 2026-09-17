import {db,isAdmin} from '@/lib/supabase';
import {productSchema} from '@/lib/validation';
import {z} from 'zod';

const tables:Record<string,string>={
  categories:'categories',
  products:'products',
  enquiries:'enquiries',
  settings:'store_settings',
  chats:'chat_sessions',
  events:'product_events'
};

type Context={params:Promise<{resource:string}>};

export async function GET(req:Request,{params}:Context){
  if(!await isAdmin())return Response.json({error:'Access denied'},{status:401});
  const {resource}=await params;

  if (resource === 'overview') {
    const [productsRes, eventsRes, enquiriesRes] = await Promise.all([
      db().from('products').select('*').order('created_at', { ascending: false }).limit(200),
      db().from('product_events').select('id,product_id,event_type,created_at').order('created_at', { ascending: false }).limit(500),
      db().from('enquiries').select('*').order('created_at', { ascending: false }).limit(100)
    ]);
    return Response.json({
      products: productsRes.data || [],
      events: eventsRes.data || [],
      enquiries: enquiriesRes.data || []
    });
  }

  const table=tables[resource];
  if(!table)return Response.json({error:'Not found'},{status:404});

  let query;
  if(resource==='settings') {
    query=db().from(table).select('*').eq('id',1);
  } else if (resource === 'events') {
    query=db().from(table).select('id,product_id,event_type,created_at').order('created_at',{ascending:false}).limit(500);
  } else {
    query=db().from(table).select('*').order('created_at',{ascending:false}).limit(200);
  }

  const {data,error}=await query;
  return Response.json(error?{error:'Data is unavailable. Check the database migration.'}:data,{status:error?503:200});
}

const safeUrl=z.string().refine(v=>v===''||/^https:\/\//.test(v));

const settingsSchema=z.object({
  logo_url:safeUrl.nullish().transform(v=>v||''),
  favicon_url:safeUrl.nullish().transform(v=>v||''),
  store_name:z.string().min(2).max(150),
  tagline:z.string().max(250),
  contact_email:z.union([z.email(),z.literal('')]),
  contact_phone:z.string().max(50),
  address:z.string().max(1000),
  about_text:z.string().max(10000),
  opening_time:z.string().nullable(),
  closing_time:z.string().nullable(),
  working_days:z.array(z.enum(['Mon','Tue','Wed','Thu','Fri','Sat','Sun'])),
  social_links:z.record(z.string(),safeUrl),
  policy_documents:z.array(z.object({name:z.string().max(150),url:z.url().refine(v=>v.startsWith('https://res.cloudinary.com/'))})),
  shipping_policy:z.string().max(10000),
  returns_policy:z.string().max(10000)
});

export async function POST(req:Request,{params}:Context){
  if(!await isAdmin())return Response.json({error:'Access denied'},{status:401});
  try{
    const {resource}=await params;
    const body=await req.json();
    let result;
    if(resource==='categories'){
      const data=z.object({name:z.string().min(2).max(100),slug:z.string().regex(/^[a-z0-9-]+$/),description:z.string().max(500),sort_order:z.coerce.number().int().min(0),is_active:z.boolean()}).parse(body);
      result=body.id?await db().from('categories').update(data).eq('id',z.uuid().parse(body.id)):await db().from('categories').insert(data);
    }else if(resource==='products'){
      const values=productSchema.parse(body);
      if(values.discount_price&&values.discount_price>=values.price)return Response.json({error:'Sale price must be below the regular price.'},{status:400});
      result=body.id?await db().from('products').update({...values,updated_at:new Date().toISOString()}).eq('id',z.uuid().parse(body.id)).select().single():await db().from('products').insert(values).select().single();
    }else if(resource==='enquiries'){
      const data=z.object({id:z.uuid(),status:z.enum(['new','contacted','closed'])}).parse(body);
      result=await db().from('enquiries').update({status:data.status}).eq('id',data.id);
    }else if(resource==='settings'){
      const data=settingsSchema.parse(body);
      result=await db().from('store_settings').upsert({...data,opening_time:data.opening_time||null,closing_time:data.closing_time||null,id:1,updated_at:new Date().toISOString()});
    }else return Response.json({error:'Not found'},{status:404});
    if(result.error)return Response.json({error:'Could not save. Check required fields and ensure the slug is unique.'},{status:400});
    return Response.json({ok:true,data:result.data});
  }catch{
    return Response.json({error:'Please check all fields and try again.'},{status:400});
  }
}

export async function DELETE(req:Request,{params}:Context){
  if(!await isAdmin())return Response.json({error:'Access denied'},{status:401});
  if((await params).resource!=='products')return Response.json({error:'Not allowed'},{status:405});
  const id=new URL(req.url).searchParams.get('id');
  if(!z.uuid().safeParse(id).success)return Response.json({error:'Invalid product'},{status:400});
  const {error}=await db().from('products').update({is_active:false}).eq('id',id!);
  return Response.json({ok:!error},{status:error?400:200});
}
