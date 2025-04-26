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
            unique: true,
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
        createdAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        updatedAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        }
    });

    return Label;
};