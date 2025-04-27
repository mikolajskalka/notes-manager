module.exports = (sequelize, DataTypes) => {
    const Label = sequelize.define('Label', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: true
            }
        },
        color: {
            type: DataTypes.STRING,
            defaultValue: '#6c757d', // Default to a neutral gray
            allowNull: false,
            validate: {
                isHexColor: true
            }
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false
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
        indexes: [
            // Create a composite unique index on name and userId
            // This ensures labels are unique per user, not globally
            {
                unique: true,
                fields: ['name', 'userId']
            }
        ]
    });

    return Label;
};