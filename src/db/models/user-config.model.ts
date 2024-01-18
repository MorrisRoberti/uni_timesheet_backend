import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { UserTable } from './user.model';

@Table({
  tableName: 'user_config',
  modelName: 'UserConfigTable',
  freezeTableName: true,
  paranoid: true,
})
export class UserConfigTable extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    unique: true,
    autoIncrement: true,
    allowNull: false,
  })
  id: number;

  @ForeignKey(() => UserTable)
  @Column({ type: DataType.INTEGER, allowNull: false })
  user_id: number;

  @Column({ type: DataType.STRING, allowNull: true })
  faculty: string;

  @Column({ type: DataType.BOOLEAN, allowNull: false })
  active: boolean = true;

  // Associations

  @BelongsTo(() => UserTable)
  user_table: UserTable;
}
