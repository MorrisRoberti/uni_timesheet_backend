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
import { SubjectTable } from './subject.model';
import { HourLogTable } from './hour-log.model';
import { WeeklyLogTable } from './weekly-log.model';

@Table({
  tableName: 'user_subjects',
  modelName: 'UserSubjectTable',
  freezeTableName: true,
  paranoid: true,
})
export class UserSubjectTable extends Model {
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

  @ForeignKey(() => SubjectTable)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  subject_id: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  cfu: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  semester: number;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  name: string;

  @Column({
    type: 'YEAR',
    allowNull: false,
  })
  aa_left: string;

  @Column({
    type: 'YEAR',
    allowNull: false,
  })
  aa_right: string;

  // Associations

  @BelongsTo(() => UserTable)
  user_table: UserTable;

  @BelongsTo(() => SubjectTable)
  subject_table: SubjectTable;

  @HasMany(() => HourLogTable)
  hour_log_table: HourLogTable;

  // @HasMany(() => WeeklyLogTable)
  // weekly_log_table: WeeklyLogTable;
}
