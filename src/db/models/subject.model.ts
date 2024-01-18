import {
  BelongsTo,
  BelongsToMany,
  Column,
  DataType,
  HasMany,
  Model,
  Table,
} from 'sequelize-typescript';
import { UserSubjectTable } from './user-subject.model';
import { HourLogTable } from './hour-log.model';

@Table({
  tableName: 'subjects',
  modelName: 'SubjectTable',
  freezeTableName: true,
  paranoid: true,
})
export class SubjectTable extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    unique: true,
    autoIncrement: true,
    allowNull: false,
  })
  id: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  name: string;

  // Associations
  @HasMany(() => UserSubjectTable)
  user_subject_table: UserSubjectTable;
}
