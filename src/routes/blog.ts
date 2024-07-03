import { Hono } from 'hono'
import {decode ,sign,verify} from 'hono/jwt'


import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'
import { createBlogInput, updateBlogInput } from '@arshdeep932985/medium-common'
export const blogRouter=new Hono<
{
    Bindings:{
        DATABASE_URL:string
        JWT_SECRET:string
    },
    Variables:{
        userId:string
    }
}>()



blogRouter.use('/*', async (c, next) => {

   try {
     const authHeader=c.req.header("authorization")||""
 
     
     const user=await verify(authHeader,c.env.JWT_SECRET)
     if(user){
         //@ts-ignore
         c.set("userId",user.id)
      await next()
     }
     else{
       c.status(403)
       return c.json({error:"unauthorized"})
     }
   } catch (error) {
    c.status(403)
    return c.json("you are not logged in")
   }
    
    
    })

blogRouter.post('/',async (c) => {

    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate())

    const authorId=c.get("userId")

        const body=await c.req.json( )

        const {success}=createBlogInput.safeParse(body)
    if(!success){
        c.status(411)
        return c.json({
            message:"inputs not correct"
        })
    }
       const post= await prisma.post.create({
            data:{
                title:body.title,
                content:body.content,
                authorId:authorId
            }
        })

    return c.json({
        id:post.id
    })
  })



  blogRouter.put('/', async(c) => {
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate())

        const body=await c.req.json( )
    const {success}=updateBlogInput.safeParse(body)
    if(!success){
        c.status(411)
        return c.json({
            message:"inputs not correct"
        })
    }
       const post= await prisma.post.update({
           where:{
            id:body.id
           },

           data:{
            title:body.title,
            content:body.content,
           
           }
        })

    return c.json({
        id:post.id
    })
  })


  blogRouter.get('/bulk',async (c)=>{
    try {
      const prisma = new PrismaClient({
          datasourceUrl: c.env.DATABASE_URL,
      }).$extends(withAccelerate())
  
      const posts=await prisma.post.findMany()
      return c.json({
         posts
      })
    } catch (error) {
     c.status(403);
     return c.json({
         message:"Error while fetching blog posts"
     })
    }
 
 
   })



  blogRouter.get('/:id', async(c) => {


    try {
        const prisma = new PrismaClient({
            datasourceUrl: c.env.DATABASE_URL,
        }).$extends(withAccelerate())
    
            const id=c.req.param("id")
    
           const post= await prisma.post.findFirst({
               where:{
                id:id
               }
            })
            if(post){
                return c.json({
                post
            })}
            
    } catch (error) {
        c.status(403);
        return c.json({
            message:"Error while fetching blog post"
        })
    }
  })

 