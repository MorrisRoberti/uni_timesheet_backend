import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  HasMany,
  Model,
  Table,
} from 'sequelize-typescript';
import { UserTable } from './user.model';
import { UserExamsTable } from './user-exams.model';

@Table({
  tableName: 'user_carreer',
  modelName: 'UserCarreerTable',
  freezeTableName: true,
  paranoid: true,
})
export class UserCarreerTable extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    unique: true,
    autoIncrement: true,
    allowNull: false,
  })
  id: number;

  @ForeignKey(() => UserTable)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  user_id: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  total_cfu: number;

  @Column({
    type: DataType.FLOAT,
    allowNull: false,
  })
  average_grade: number;

  @Column({
    type: DataType.FLOAT,
    allowNull: false,
  })
  average_graduation_grade: number;

  // Associations

  @BelongsTo(() => UserTable)
  user_table: UserTable;

  @HasMany(() => UserExamsTable)
  user_exams_table: UserExamsTable;
}