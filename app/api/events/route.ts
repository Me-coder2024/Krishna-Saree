import {db} from '@/lib/supabase';
import {z} from 'zod';
import {limited} from '@/lib/rate-limit';
export async function POST(req:Request){if(limited(`event:${req.headers.get('x-forwarded-for')||'local'}`,60))return new Response(null,{status:429});try{const body=z.object({product_id:z.uuid(),event_type:z.enum(['view','wishlist','add_to_cart'])}).parse(await req.json());const {data}=await db().from('products').select('id').eq('id',body.product_id).eq('is_active',true).maybeSingle();if(!data)return Response.json({ok:true,preview:true});const {error}=await db().from('product_events').insert(body);return Response.json({ok:!error},{status:error?503:200});}catch{return Response.json({error:'Invalid event'},{status:400});}}
