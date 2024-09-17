import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { UserSubjectTable } from './user-subject.model';
import { UserCarreerTable } from './user-carreer.model';

@Table({
  tableName: 'user_exams',
  modelName: 'UserExamsTable',
  freezeTableName: true,
  paranoid: true,
})
export class UserExamsTable extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    unique: true,
    autoIncrement: true,
    allowNull: false,
  })
  id: number;

  @ForeignKey(() => UserCarreerTable)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  user_carreer_id: number;

  @ForeignKey(() => UserSubjectTable)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  user_subject_id: number;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: true,
  })
  passed: boolean;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  date: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  user_subject_name: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  grade: number;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
  })
  accepted: boolean;

  // Associations

  @BelongsTo(() => UserCarreerTable)
  user_carreer_table: UserCarreerTable;

  @BelongsTo(() => UserSubjectTable)
  user_subject_table: UserSubjectTable;
}
