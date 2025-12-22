import { Transfer } from './Transfer';

/**
 * Consumer-facing reporesentation of an Account.
 */
export interface Account {
  accountId: number;
  balance: number;
  transferHistory: Transfer[];
}

/**
 * An Account as it appears in the database.
 */
export interface AccountDTO {
  id: number;
  balance: number;
  customerId: number; // id of the customer that owns the account
}
