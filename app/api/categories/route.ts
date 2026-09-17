import {db} from '@/lib/supabase';
import {defaultCategories} from '@/lib/categories';
export async function GET(){try{const {data,error}=await db().from('categories').select('*').eq('is_active',true).order('sort_order');return Response.json(error?defaultCategories:data);}catch{return Response.json(defaultCategories);}}
