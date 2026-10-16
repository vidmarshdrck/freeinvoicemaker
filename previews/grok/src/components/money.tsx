import { money as formatMoney } from '@/lib/invoice-store';
export function Money({amount,currency}:{amount:number;currency:string}) {
 const value=formatMoney(amount,currency);
 if(currency !== 'ZMW') return <span className="money"><span>{value}</span></span>;
 return <span className="money"><span>ZMW</span>{' '}<span>{new Intl.NumberFormat('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}).format(amount || 0)}</span></span>;
}
export const money=(amount:number,currency:string)=><Money amount={amount} currency={currency}/>;
