import 'server-only';
import {cache} from 'react';
import {db} from './supabase';
import {samples,defaultSettings,Product,Settings} from './catalog';
export const catalog=cache(async function catalog():Promise<{products:Product[];demo:boolean}>{try{const {data,error}=await db().from('products').select('*').eq('is_active',true).order('created_at',{ascending:false});if(error||!data?.length) return {products:samples,demo:true};return {products:data as Product[],demo:false};}catch{return {products:samples,demo:true};}});
export const settings=cache(async function settings():Promise<Settings>{try{const {data}=await db().from('store_settings').select('*').eq('id',1).single();return {...defaultSettings,...data};}catch{return defaultSettings;}});
