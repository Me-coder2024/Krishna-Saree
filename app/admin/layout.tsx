import {AdminShell} from '@/components/admin';
export const metadata={title:'Store management',robots:{index:false,follow:false}};
export default function Layout({children}:{children:React.ReactNode}){return <AdminShell>{children}</AdminShell>;}
