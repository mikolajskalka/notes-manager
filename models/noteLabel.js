module.exports = (sequelize, DataTypes) => {
    const NoteLabel = sequelize.define('NoteLabel', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        noteId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Notes',
                key: 'id'
            },
            onDelete: 'CASCADE'
        },
        labelId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Labels',
                key: 'id'
            },
            onDelete: 'CASCADE'
        },
        createdAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        updatedAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        }
    }, {
        tableName: 'NoteLabels',
        indexes: [
            {
                unique: true,
                fields: ['noteId', 'labelId']
            }
        ]
    });

    return NoteLabel;
};