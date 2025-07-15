// In your actions file, or a new file like `db-types.ts`
import { ObjectId } from 'mongodb';
import { Product } from '../types/index' ; // Adjust path if in a new file

//  maps 'string' _id to 'ObjectId' for database interaction
export type ProductDb = Omit<Product, '_id'> & { _id?: ObjectId };

