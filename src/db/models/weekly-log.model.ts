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
import { HourLogTable } from './hour-log.model';
import { UserSubjectTable } from './user-subject.model';

@Table({
  tableName: 'weekly_log_table',
  modelName: 'WeeklyLogTable',
  freezeTableName: true,
  paranoid: true,
})
export class WeeklyLogTable extends Model {
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

  // @ForeignKey(() => UserSubjectTable)
  // @Column({
  //   type: DataType.INTEGER,
  //   allowNull: false,
  // })
  // user_subject_id: number;

  @Column({
    type: DataType.DATEONLY,
    allowNull: false,
  })
  week_start: string;

  @Column({
    type: DataType.DATEONLY,
    allowNull: false,
  })
  week_end: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  hours: number;

  @Column({ type: DataType.INTEGER, allowNull: false, validate: { max: 59 } })
  minutes: number;

  // Associations

  @BelongsTo(() => UserTable)
  user_table: UserTable;

  // @BelongsTo(() => UserSubjectTable)
  // user_subject_table: UserSubjectTable;

  @HasMany(() => HourLogTable)
  hour_log_table: HourLogTable;
}
