# websockets chatpalace

Run ```npm install``` 

Start the server: 
~~~
npm start
~~~
or, for hot reload during development:
~~~
npm run dev
~~~


**User creates a room**

- user creates a room
- server registers the room in the rooms_list
- server sends room info to connected_users
- users update their rooms_list

**Room enter**

- User goes to other room
- server removes user from room[previous].users
- server adds user to room[new].users
... 

**Room leave**
- User goes to other (or the main) room 
- server removes user from room[previous].users
- server adds user to room[new].users
...

**Room possibilities**

 * change background color or image
 * add props (images)
 
* iptscrae, kijken of het haalbaar is om (een deel van) iptscrae te implementeren

##Fase 3

Option to save room / friendlists / userinfo  with MongoDB or something
