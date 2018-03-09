const express = require('express');
const router = express.Router();
const billingCycle = require('../models/billingCycle');
const pacienteModel = require('../models/paciente');
const clinicaModel = require('../models/clinica');
const mongoose = require('mongoose');

const conveniosPorMes = (clinica_id, callback) => {
    pacienteModel.aggregate(
        [
            // Match the document containing the array element
            { "$match": { "clinica_id": mongoose.Types.ObjectId(clinica_id) } },

            // Unwind to "de-normalize" the array content
            { "$unwind": "$agendamentos" },

            // Group back and just return the fields you want
            {
                $group: {
                    _id: { id: "$agendamentos.convenio_id", month: "$agendamentos.start" },
                    count: { $sum: 1 }
                }
            },
            { $project: { _id: 0, _id: "$_id.id", "mes": { $substr: ["$_id.month", 5, 2] }, count: "$count" } },
        ],
        function (err, result) {
            if (err) {
                return callback(err.message)
            }
            else if (result.length == 0) {
                return callback([])
            }
            else {
                // res.status(200).json({ data: result, success: true })
                clinicaModel.findById(clinica_id, function (err, clinica) {
                    if (err) {
                        return callback(err.message)
                    }
                    else {
                        const resultado = []
                        for (i = 0; i < result.length; i++) {
                            for (j = 0; j < clinica.convenios.length; j++) {
                                if (result[i]._id.toString() == clinica.convenios[j]._id.toString()) {
                                    const value = Number(clinica.convenios[j].valor) * Number(result[i].count)
                                    const name = result[i].mes
                                    const obj = { value, name }
                                    resultado.push(obj)
                                }
                            }
                        }

                        return callback(resultado)
                    }
                })
            }
        });
}


router.get('/', (req, res) => {
    conveniosPorMes('5a9c531f246d1333cf823954', result => {
        // pegar o clinica_id e fazer os calculos em cima das despesas
    })
});

router.post('/', (req,res) => {
    
});

module.exports = router