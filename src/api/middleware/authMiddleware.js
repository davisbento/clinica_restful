const jwt = require('jsonwebtoken');
const user = require('mongoose').model('Usuario');

module.exports = function(req, res, next){
    if(!req.headers.authorization){
        return res.status(401).json({message: "Unauthorized"});
    }

    const token = req.headers.authorization.split(' ')[1];

    jwt.verify(token, process.env.SECRET_KEY, (err, decoded) => {
        // the 401 code is for unauthorized status
        if (err) { 
            return res.status(401).json({message: "Unauthorized"}); 
        }

        const userId = decoded.sub;
        // check if a user exists
        user.findById(userId, (userErr, user) => {
            if (userErr || !user) {
                return res.status(401).json({message: "Unauthorized"});
            }

            req.usuario = user._id;

            return next();
        });
    });
}