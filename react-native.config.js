module.exports = {
  dependencies: {
    'react-native-permissions': {
      platforms: {
        android: {
          sourceDir: '../node_modules/react-native-permissions/android',
          packageImportPath: 'import io.github.zoontek.rnpermissions.RNPermissionsPackage;',
        },
      },
    },
  },
};