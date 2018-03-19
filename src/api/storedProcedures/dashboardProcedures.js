const pacienteModel = require('../models/paciente');
const clinicaModel = require('../models/clinica');
const mongoose = require('mongoose');

const contagemPorTipoStatus = (clinica_id) => {
    pacienteModel.aggregate([
        // Match the document containing the array element
        {
            "$match": {
                "clinica_id": mongoose.Types.ObjectId(clinica_id)
            }
        },

        // Unwind to "de-normalize" the array content
        {
            "$unwind": "$agendamentos"
        },

        // Group back and just return the fields you want
        {
            $group: {
                _id: "$agendamentos.status",
                count: {
                    $sum: 1
                }
            }
        },
        {
            $project: {
                _id: 0,
                name: "$_id",
                value: "$count"
            }
        },
    ])
};

module.exports = { contagemPorTipoStatus }