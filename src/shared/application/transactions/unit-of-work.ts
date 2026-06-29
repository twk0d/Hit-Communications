export type UnitOfWorkHandler<TResult, TContext = unknown> = (
  context: TContext,
) => Promise<TResult>;

export interface UnitOfWork<TContext = unknown> {
  execute<TResult>(handler: UnitOfWorkHandler<TResult, TContext>): Promise<TResult>;
}

export const UNIT_OF_WORK = Symbol('UNIT_OF_WORK');
