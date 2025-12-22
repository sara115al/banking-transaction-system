import { Account } from './Account';

/**
 * Consumer-facing reporesentation of a Customer.
 */
export interface Customer {
  id: number;
  name: string;
  accounts: Account[];
}

/**
 * A Customer as it appears in the database.
 */
export interface CustomerDTO {
  id: number;
  name: string;
}
