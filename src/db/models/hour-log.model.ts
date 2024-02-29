import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { UserTable } from './user.model';
import { UserSubjectTable } from './user-subject.model';
import { WeeklyLogTable } from './weekly-log.model';

@Table({
  tableName: 'hour_logs',
  modelName: 'HourLogTable',
  freezeTableName: true,
  paranoid: true,
})
export class HourLogTable extends Model {
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

  @ForeignKey(() => UserSubjectTable)
  @Column({ type: DataType.INTEGER, allowNull: false })
  user_subject_id: number;

  @Column({ type: DataType.INTEGER, allowNull: false })
  hours: number;

  @Column({ type: DataType.INTEGER, allowNull: false, validate: { max: 59 } })
  minutes: number;

  @Column({ type: DataType.DATEONLY, allowNull: false })
  date: string;

  @ForeignKey(() => WeeklyLogTable)
  @Column({ type: DataType.INTEGER, allowNull: false })
  weekly_log_id: number;

  @Column({ type: DataType.STRING, allowNull: true })
  description: string;

  // Associations

  @BelongsTo(() => UserSubjectTable)
  user_subject_table: UserSubjectTable;

  @BelongsTo(() => UserTable)
  user_table: UserTable;
}
