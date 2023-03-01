const path = require('path');

const express = require('express');

const router = express.Router();
const Expense = require('../models/expense');
const AWS=require('aws-sdk')
const jwt = require('jsonwebtoken')
const bodyParser = require('body-parser');
const User = require('../models/user');
// const { Sequelize } = require('sequelize');
require("dotenv").config();
const sequelize=require('../util/database');
const { resolve } = require('path');
const { rejects } = require('assert');
router.use(bodyParser.json())
// router.use(bodyParser.urlencoded({ extended: true }));


function uploadToS3(data,filename){
    const BUCKET_NAME=process.env.BUCKET_NAME
    const IAM_USER_KEY=process.env.IAM_USER_KEY
    const IAM_SECRET_KEY=process.env.IAM_SECRET_KEY

    let s3bucket=new AWS.S3({
        accessKeyId:IAM_USER_KEY,
        secretAccessKey:IAM_SECRET_KEY,
        Bucket:BUCKET_NAME
    })

    
        var params={
            Bucket:BUCKET_NAME,
            Key:filename,
            Body:data,
            ACL:'public-read'
        }

        return new Promise((resolve,reject)=>{
            s3bucket.upload(params,(err,s3response)=>{
                if(err){
                    console.log("Somethin went wrong",err);
                    reject(err);
                }
                else{
                    console.log("SUCESS",s3response);
                    resolve(s3response.Location);
                }
            })
        })
        

}



exports.downloadExpense=async(req,res,next)=>{
    const expenses=await req.user.getExpenses();
    console.log("expenses=======>",expenses);
    const stringfiedExpenses=JSON.stringify(expenses);
    const userId=req.user.id;
    const filename=`Expense${userId}/${new Date()}.txt`;
    const fileURL=await uploadToS3(stringfiedExpenses,filename);
    res.status(200).json({fileURL, sucess:true})
}









exports.postAddExpense= async (req,res,next)=>{
    const t = await sequelize.transaction();
    try{
        
        var amount=req.body.amount;
        var Description=req.body.Description;
        var category=req.body.category;
        const data= await Expense.create({amount:amount, Description:Description, category:category, userId: req.user.id},{transcation:t})
        
        const totalExpense=Number(req.user.totalExpenses)+Number(amount)
        console.log(totalExpense)
        await User.update({totalExpenses:totalExpense},{where:{id:req.user.id},transcation:t}) 
        await t.commit()
        res.status(201).json({newExpenseDetail:data})
    }
    catch(err){
        await t.rollback();
        res.status(500).json({

            error:err
        })
    }
}

exports.getExpenses= (req, res,next)=> {
    
    Expense.findAll({ where : { userId: req.user.id}}).then(expenses => {
        console.log("req====>",req.user.id)
        console.log(expenses)
        return res.status(200).json({allExpenses:expenses, success: true})
    })
    .catch(err => {
        console.log(err)
        return res.status(500).json({ error: err, success: false})
    })
}

exports.deleteExpense = async(req,res,next)=>{
    try{
        const uId=req.params.id;
        console.log(uId);
        // const totalExpense=Number(req.user.totalExpenses)+Number(amount)
        console.log("totexpense=====>",req.user.totalExpenses);
        const delData=await Expense.findByPk(uId).then(delexpense=>{
            return delexpense.dataValues.amount
            // console.log("delexpense===>",delexpense.dataValues.amount);  
        })
        // console.log("totexpense=====>",delData);
        let delTotExpense=Number(req.user.totalExpenses)-Number(delData);
        console.log("delTotExpense====>",delTotExpense)
        await User.update({totalExpenses:delTotExpense},{where:{id:req.user.id}})
        await Expense.destroy({where:{id:uId}});
    
        res.sendStatus(200);
    }
    catch(err){
        console.log(err);
        res.status(500).json(err);
    }
    
}