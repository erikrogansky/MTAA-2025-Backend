const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const setupSwagger = (app) => {
  const options = {
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'Cookly API',
        version: '1.0.0',
        description: 'API documentation for Cookly, a recipe management application. This API provides endpoints for creating, managing, and sharing recipes, as well as user authentication and interaction.',
      },

      components: {
        securitySchemes: {
          BearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
    },
    apis: ['./routes/*.js'],
  };

  const swaggerSpec = swaggerJsdoc(options);

  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};

module.exports = setupSwagger;
