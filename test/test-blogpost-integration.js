'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const faker = require('faker');
const mongoose = require('mongoose');

const expect = chai.expect;

const {BlogPost} = require('../models');
const {app, runServer, closeServer} = require('../server');
const {TEST_DATABASE_URL} = require('../config');

chai.use(chaiHttp); 

function seedBlogPostData() {                       
  console.info('seeding blog post data');
  const seedData = [];

  for (let i=1; i<=5; i++) {
    seedData.push(generateBlogPostData());
  }
  return BlogPost.insertMany(seedData);    
}

function generateBlogPostData() {   
  return {
    author: {
    	firstName: faker.name.firstName(),
    	lastName: faker.name.lastName()
    },  
    title: faker.hacker.phrase(),
    content: faker.lorem.sentences(),
    created: faker.date.recent()
  };
}

function tearDownDb() {
  console.warn('Deleting database');
  return mongoose.connection.dropDatabase(); 
}

describe('Blog Posts API resource', function() {

  before(function() { 
    return runServer(TEST_DATABASE_URL);
  });

  beforeEach(function() {  
    return seedBlogPostData();
  });

  afterEach(function() {
    return tearDownDb();
  });

  after(function() { 
    return closeServer();
  });

  describe('GET endpoint', function() {

    it('should return all existing blog posts', function() {
      let res;
      return chai.request(app)
        .get('/posts')
        .then(function(_res) {  
          res = _res;
          expect(res).to.have.status(200);
          expect(res.body).to.have.lengthOf.at.least(1);
          return BlogPost.count();  
        })
        .then(function(count) {
          expect(res.body).to.have.lengthOf(count);
        });    	
    });

    it('should return blog posts with right fields', function() {

      let resBlogPost;
      return chai.request(app)  
        .get('/posts')    
        .then(function(res) { 
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('array');
          expect(res.body).to.have.lengthOf.at.least(1);

          res.body.forEach(function(post) {
            expect(post).to.be.a('object');
            expect(post).to.include.keys(
              'id', 'author', 'content', 'title', 'created');
          });
          resBlogPost = res.body[0];
          return BlogPost.findById(resBlogPost.id);
        })
        .then(function(post) {

          expect(resBlogPost.id).to.equal(post.id);
          expect(resBlogPost.author).to.equal(post.authorName);
          expect(resBlogPost.content).to.equal(post.content);
          expect(resBlogPost.title).to.equal(post.title);
        });
    });
  });

  describe('POST endpoint', function() {
    it('should add a new blog post', function() {

      const newBlogPost = generateBlogPostData();

      return chai.request(app)
        .post('/posts')
        .send(newBlogPost)
        .then(function(res) {
          expect(res).to.have.status(201);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body).to.include.keys(
            'id', 'author', 'content', 'title', 'created');
          expect(res.body.author).to.equal(newBlogPost.author.firstName + " " + newBlogPost.author.lastName); 
          expect(res.body.id).to.not.be.null;
          expect(res.body.content).to.equal(newBlogPost.content);
          expect(res.body.title).to.equal(newBlogPost.title);

          return BlogPost.findById(res.body.id);   
        })
        .then(function(post) {
          expect(post.author.firstName).to.equal(newBlogPost.author.firstName); 
          expect(post.author.lastName).to.equal(newBlogPost.author.lastName); 
          expect(post.content).to.equal(newBlogPost.content);
          expect(post.title).to.equal(newBlogPost.title);
        });
    });
  });

  describe('PUT endpoint', function() {

    it('should update fields you send over', function() {
      const updateData = {
        title: 'Seasons',
        content: 'Fantastic Sams'
      };

      return BlogPost
        .findOne()
        .then(function(post) {
          updateData.id = post.id;

          return chai.request(app)                    
            .put(`/posts/${post.id}`)     
            .send(updateData);
        })
        .then(function(res) {
          expect(res).to.have.status(204);           

          return BlogPost.findById(updateData.id);  
        })
        .then(function(post) {
          expect(post.title).to.equal(updateData.title);
          expect(post.content).to.equal(updateData.content);
        });
    });
  });



  });































































































