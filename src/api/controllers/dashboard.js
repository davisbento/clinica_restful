const express = require('express');
const moment = require('moment');
const router = express.Router();
const pacienteModel = require('../models/paciente');
const clinicaModel = require('../models/clinica');
const checkAuth = require('../middleware/authMiddleware');
const mongoose = require('mongoose');

router.get('/summary/:clinica_id', checkAuth, function (req, res) {
    const clinica_id = mongoose.Types.ObjectId(req.params.clinica_id);
    let counter = {};
    pacienteModel.aggregate([
        { "$match": { "clinica_id": clinica_id } },
        // unwind binding collection
        { $unwind: "$agendamentos" },

        // group and count by relevant attributes
        {
            $group: {
                _id: 1,
                count: { $sum: 1 }
            }
        }
    ], function (err, docs) {
        if (err) {
            res.status(500).json({ message: err.message })
        }
        else if (docs.length == 0) {
            res.status(200).json({ data: [], success: true })
        }
        else {
            counter["agendamentos"] = docs[0].count;
            pacienteModel.count({}, function (err, dados) {
                counter["pacientes"] = dados;
                res.json({ data: counter, success: true });
            });
        }
    });
});


router.get('/contagemPorConvenioMes/:clinica_id', checkAuth, function (req, res) {
    pacienteModel.aggregate(
        [
            // Match the document containing the array element
            { "$match": {
                $and: [ 
                    {"clinica_id": mongoose.Types.ObjectId(req.params.clinica_id) },
                    {"agendamentos.status": "Finalizado"} ] 
            } },

            // Unwind to "de-normalize" the array content
            { "$unwind": "$agendamentos" },

            // Group back and just return the fields you want
            {
                $group: {
                    _id: { month: { $substr: ["$agendamentos.start", 5, 2] } },
                    count: { $sum: 1 }
                }
            },
            { $project: { _id: 0, name: "$_id.month", value: "$count" } },
        ],
        function (err, result) {
            if (err) {
                res.json(err)
            }
            else if (result.length == 0) {
                res.status(200).json({ data: [], success: true })
            }
            else {
                res.status(200).json({ data: result, success: true })
            }
        });
})

router.get('/contagemPorConvenio/:clinica_id', checkAuth, function (req, res) {
    pacienteModel.aggregate(
        [
            // Match the document containing the array element
            { "$match": {
                $and: [ 
                    {"clinica_id": mongoose.Types.ObjectId(req.params.clinica_id) },
                    {"agendamentos.status": "Finalizado"} ] 
            } },

            // Unwind to "de-normalize" the array content
            { "$unwind": "$agendamentos" },

            // Group back and just return the fields you want
            {
                $group: {
                    _id: "$agendamentos.convenio_id",
                    count: { $sum: 1 }
                }
            },
            { $project: { _id: 0, _id: "$_id", count: "$count" } },
        ],
        function (err, result) {
            if (err) {
                res.json(err)
            }
            else if (result.length == 0) {
                res.status(200).json({ data: [], success: true })
            }
            else {
                // res.status(200).json({ data: result, success: true })
                clinicaModel.findById(req.params.clinica_id, function (err, clinica) {
                    if (err) {
                        res.status(500).json({ "message": err.message })
                    }
                    else {
                        const resultado = []
                        for (i = 0; i < result.length; i++) {
                            for (j = 0; j < clinica.convenios.length; j++) {
                                if (result[i]._id.toString() == clinica.convenios[j]._id.toString()) {
                                    const name = clinica.convenios[j].nome
                                    const value = Number(clinica.convenios[j].valor) * Number(result[i].count)
                                    const obj = { name, value }
                                    resultado.push(obj)
                                }
                            }
                        }

                        res.status(200).json({ data: resultado, success: true })
                    }
                })
            }
        });
})


/*
   @in: clinica_id
   @out: {"data":{"media":number,"finalizados":number,"cancelados":number},"success":true}
*/
router.get('/conversaoConsultas/:clinica_id', checkAuth, function(req,res) {
    pacienteModel.aggregate(
        [
            // Match the document containing the array element
            { "$match": { "clinica_id": mongoose.Types.ObjectId(req.params.clinica_id) } },

            // Unwind to "de-normalize" the array content
            { "$unwind": "$agendamentos" },

            // Group back and just return the fields you want
            {
                $group: {
                    _id: "$agendamentos.status",
                    count: { $sum: 1 }
                }
            },
            { $project: { _id: 0, _id: "$_id", count: "$count" } },
        ],
        function (err, result) {
            if (err) {
                res.json({"message": err.message})
            }
            else if (result.length == 0) {
                res.status(200).json({ data: [], success: true })
            }
            else {
                let total = 0;
                let finalizados = result.filter(e => e._id === "Finalizado");
                let cancelados = result.filter(e => e._id === "Cancelado");
                // soma para obter o total de consultas
                result.filter(e => {
                    total += e.count;
                })

               finalizados = finalizados.length > 0 ? finalizados[0].count : 0;
               cancelados = cancelados.length > 0 ? cancelados[0].count : 0;

                const media = ((finalizados / total) * 100).toFixed(2) + '%' ;

                res.status(200).json({ data: { media, finalizados, cancelados }, success: true })
            }
        });
});

router.get('/contagemPorTipoStatus/:clinica_id', checkAuth, function(req,res) {
    pacienteModel.aggregate([
            // Match the document containing the array element
            { "$match": { "clinica_id": mongoose.Types.ObjectId(req.params.clinica_id) } },

            // Unwind to "de-normalize" the array content
            { "$unwind": "$agendamentos" },

            // Group back and just return the fields you want
            {
                $group: {
                    _id: "$agendamentos.status",
                    count: { $sum: 1 }
                }
            },
            { $project: { _id: 0, name: "$_id", value: "$count" } },
    ], function(err, result) {
        if(err) {
            res.status(500).json({ "message": err.message })
        }
        else {
            res.status(200).json({ data: result, success: true });
        }
    })
});

module.exports = router;