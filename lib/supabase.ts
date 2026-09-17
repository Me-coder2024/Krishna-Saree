import 'server-only';
import {createClient} from '@supabase/supabase-js';
import {createServerClient} from '@supabase/ssr';
import {cookies} from 'next/headers';
export function db(){return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.SUPABASE_SECRET_KEY!,{auth:{persistSession:false,autoRefreshToken:false}});}
export async function sessionClient(){const jar=await cookies();return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,{cookies:{getAll:()=>jar.getAll(),setAll:(items)=>{try{items.forEach(({name,value,options})=>jar.set(name,value,options));}catch{}}}});}
export async function isAdmin(){const client=await sessionClient();const {data:{user}}=await client.auth.getUser();if(!user)return false;const {data}=await client.from('admin_profiles').select('role').eq('id',user.id).single();return data?.role==='admin';}
