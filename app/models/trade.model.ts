import { query } from '../database';
import { camelcaseAll } from '../util';

export interface TradeBase {
  buyerId: number;
  sellerId: number;
  bookId: number;
}

export interface Trade extends TradeBase {
  tradeId: number;
}

export function createOneTrade(trade: TradeBase) {
  return query('insert into trades (buyer_id, seller_id, book_id) values (?, ?, ?)', [trade.buyerId, trade.sellerId, trade.bookId]);
}

export function deleteOneTrade(id: number) {
  return query('delete from trades where trade_id = ?', [id]);
}

export async function findTradeById(id: number): Promise<Trade | undefined> {
  const result = await query('select * from trades where trade_id = ?', [id]);
  if (result && result.length) {
    return camelcaseAll(result[0]);
  }
}

export function findTradesByBuyer(id: number): Promise<Trade[]> {
  return query('select * from trades where buyer_id = ?', [id])
    .then(result => (result || []).map((trade: any) => camelcaseAll(trade)));
}

export function findTradesBySeller(id: number): Promise<Trade[]> {
  return query('select * from trades T where seller_id = ?', [id])
    .then(result => (result || []).map((trade: any) => camelcaseAll(trade)));
}

export function findTrades(id: number): Promise<Trade[]> {
  return query('select * from trades T join books B where T.book_id = B.book_id and (T.seller_id = ? or T.buyer_id = ?) ', [id, id])
    .then(result => (result || []).map((trade: any) => camelcaseAll(trade)));
}

export async function findTradeByBook(id: number): Promise<Trade | undefined> {
  const result = await query('select * from trades where book_id = ?', [id]);
  if (result && result.lengh) {
    return camelcaseAll(result[0]);
  }
}
