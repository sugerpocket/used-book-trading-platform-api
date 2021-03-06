import { Context } from 'koa';
import { findTrades, createOneTrade, findTradeById, deleteOneTrade } from '../models/trade.model';
import { retrieveOneDetail, updateState } from '../models/book.model';
import { SoftError } from '../error';

export async function retrieveSelfTrades(ctx: Context, next: () => Promise<any>) {
  const uid: number = ctx.state.user.studentId;
  const result = await findTrades(uid);

  ctx.body = result;
}

export async function trade(ctx: Context, next: () => Promise<any>) {
  const bid: number = ctx.params.bookId;
  const uid: number = ctx.state.user.studentId;

  const book = await retrieveOneDetail(bid);

  if (book.state !== 1) {
    throw SoftError.create(ctx, '该书已经出售');
  }

  if (book.publisherId === uid) {
    throw SoftError.create(ctx, '不能购买自己上架的书籍');
  }

  const { insertId } = await createOneTrade({
    buyerId: uid,
    sellerId: book.publisherId,
    bookId: book.bookId,
  });

  const result = await findTradeById(insertId);

  await updateState(2, book.bookId);

  ctx.body = result;
}

export async function sendBook(ctx: Context, next: () => Promise<any>) {
  const tid: number = ctx.params.tid;
  const uid: number = ctx.state.user.studentId;

  const trade = await findTradeById(tid);

  if (trade.sellerId !== uid) {
    throw SoftError.create(ctx, '不是该书的商家，不能确认送货');
  }

  const book = await retrieveOneDetail(trade.bookId);

  if (book.state !== 2) {
    throw SoftError.create(ctx, '该书已送达或还未开始交易');
  }

  await updateState(3, trade.bookId);
  ctx.body = '正在送货';
}

export async function cancelTrade(ctx: Context, next: () => Promise<any>) {
  const tid: number = ctx.params.tid;
  const uid: number = ctx.state.user.studentId;

  const trade = await findTradeById(tid);

  if (trade.buyerId !== uid) {
    throw SoftError.create(ctx, '不是该书的买家，不能取消交易');
  }

  const book = await retrieveOneDetail(trade.bookId);

  if (book.state === 1) {
    throw SoftError.create(ctx, '未产生交易的书籍');
  } else if (book.state === 4) {
    throw SoftError.create(ctx, '到货书籍不能取消');
  }

  await updateState(1, trade.bookId);
  await deleteOneTrade(tid);

  ctx.body = {
    ...trade,
    ...book,
  };
}

export async function recieveBook(ctx: Context, next: () => Promise<any>) {
  const tid: number = ctx.params.tid;
  const uid: number = ctx.state.user.studentId;

  const trade = await findTradeById(tid);

  if (trade.buyerId !== uid) {
    throw SoftError.create(ctx, '不是该书的买家，不能确认收货');
  }

  const book = await retrieveOneDetail(trade.bookId);

  if (book.state !== 3) {
    throw SoftError.create(ctx, '该书还开始送货');
  }

  await updateState(4, trade.bookId);
  ctx.body = '确认收货';
}
