import { Column, DataType, HasMany, Model, Table } from 'sequelize-typescript';
import { UserSubjectTable } from './user-subject.model';
import { HourLogTable } from './hour-log.model';
import { UserConfigTable } from './user-config.model';
import { WeeklyLogTable } from './weekly-log.model';

@Table({
  tableName: 'users',
  modelName: 'UserTable',
  freezeTableName: true,
  paranoid: true,
})
export class UserTable extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    unique: true,
    autoIncrement: true,
    allowNull: false,
  })
  id: number;

  @Column({ type: DataType.STRING, allowNull: true })
  first_name: string;

  @Column({ type: DataType.STRING, allowNull: true })
  last_name: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    validate: { isEmail: true },
  })
  email: string;

  @Column({ type: DataType.STRING, allowNull: false })
  password: string;

  // Associations

  @HasMany(() => UserSubjectTable)
  user_subject_table: UserSubjectTable;

  @HasMany(() => HourLogTable)
  hour_log_table: HourLogTable;

  @HasMany(() => UserConfigTable)
  user_config_table: UserConfigTable;

  @HasMany(() => WeeklyLogTable)
  weekly_log_table: WeeklyLogTable;
}
