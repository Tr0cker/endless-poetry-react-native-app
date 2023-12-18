import os
from flask import Flask, jsonify, request
import mysql.connector
from flask_cors import CORS
from flask_bcrypt import Bcrypt
import base64
import random


app = Flask(__name__)
CORS(app)
bcrypt = Bcrypt(app)  # Initialize Bcrypt


# Database connection configuration
db_config = {
    'host': 'localhost',
    'user': 'root',
    'password': '',
    'database': 'endlesspoetry'
}



def connect_to_database():
    try:
        connection = mysql.connector.connect(**db_config)
        return connection
    except mysql.connector.Error as error:
        print('Error connecting to the database:', error)
        return None





@app.route('/')
def display_data():
    # Connect to the database
    connection = connect_to_database()
    if connection is None:
        return 'Error connecting to the database'

    try:
        # Create a cursor object
        cursor = connection.cursor()

        # Execute an SQL query with ORDER BY clause
        cursor.execute("SELECT * FROM poem_post ORDER BY poetry_id DESC")

        # Fetch the results
        results = cursor.fetchall()

        # Close the cursor and connection
        cursor.close()
        connection.close()

        # Convert the results to JSON format
        output = []
        for row in results:
            data = {
                'poetry_id': row[0],
                'username': row[1],
                'title': row[2],
                'poem_text': row[3],
                'like_count': row[4],
                'comment_count': row[5],
                'user_id': row[6],  # Add the 'user_id' column to the response
                'poet_name': row[7]
            }
            output.append(data)

        return jsonify(output)

    except mysql.connector.Error as error:
        print('Error executing SQL query:', error)
        return 'Error executing SQL query'







@app.route('/comments', methods=['POST'])
def get_comments_with_likes_dislikes():
    data = request.get_json()
    poetry_id = data.get('poetry_id')
    user_id = data.get('user_id')

    if poetry_id is None or user_id is None:
        return 'Invalid input data'

    connection = connect_to_database()
    if connection is None:
        return 'Error connecting to the database'

    try:
        cursor = connection.cursor()
        query = """
            SELECT 
                c.comment_id, c.username, c.comment_text, c.like_count, c.dislike_count, 
                c.poetry_id, c.user_id, IFNULL(lc.id, 0) AS isLiked, IFNULL(dc.id, 0) AS isDisliked,
                COALESCE(img.image_url, 'false') AS image_url
            FROM comment c
            LEFT JOIN liked_comment lc ON c.comment_id = lc.comment_id AND lc.user_id = %s
            LEFT JOIN disliked_comment dc ON c.comment_id = dc.comment_id AND dc.user_id = %s
            LEFT JOIN image img ON c.user_id = img.user_id  -- Join with image table
            WHERE c.poetry_id = %s
        """
        cursor.execute(query, (user_id, user_id, poetry_id))
        results = cursor.fetchall()

        cursor.close()
        connection.close()

        output = []
        for row in results:
            data = {
                'comment_id': row[0],
                'username': row[1],
                'comment_text': row[2],
                'like_count': row[3],
                'dislike_count': row[4],
                'poetry_id': row[5],
                'user_id': row[6],
                'isLiked': bool(row[7]),
                'isDisliked': bool(row[8]),
                'image_url': row[9]  # Include image_url
            }
            output.append(data)

        return jsonify(output)

    except mysql.connector.Error as error:
        print('Error executing SQL query:', error)
        return 'Error executing SQL query'






@app.route('/login', methods=['POST'])
def login():
    if request.method == 'POST':
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')

        connection = connect_to_database()
        if connection is None:
            return jsonify({'message': 'Error connecting to the database'}), 500

        try:
            cursor = connection.cursor()
            query = "SELECT * FROM users WHERE username = %s"
            cursor.execute(query, (username,))
            user_data = cursor.fetchone()

            cursor.close()
            connection.close()

            if user_data and user_data[2] == password:
                user_id = user_data[0]
                response_data = {
                    'message': 'Login successful',
                    'userId': user_id,
                    'username': username
                }
                return jsonify(response_data), 200
            else:
                return jsonify({'message': 'Invalid username or password'}), 401

        except mysql.connector.Error as error:
            print('Error executing SQL query:', error)
            return jsonify({'message': 'Error executing SQL query'}), 500






@app.route('/user_profile', methods=['POST'])
def user_profile():
    data = request.get_json()
    user_id = data.get('user_id')

    if user_id is None:
        return jsonify({'message': 'Invalid input data'}), 400

    connection = connect_to_database()
    if connection is None:
        return jsonify({'message': 'Error connecting to the database'}), 500

    try:
        cursor = connection.cursor()

        # Get username and bio
        cursor.execute("SELECT username, bio FROM users WHERE id = %s", (user_id,))
        user_data = cursor.fetchone()

        if user_data:
            username, bio = user_data
        else:
            return jsonify({'message': 'User not found'}), 404

        # Calculate followers count
        cursor.execute("SELECT COUNT(*) AS followers_count FROM followers WHERE user_id = %s", (user_id,))
        followers_count = cursor.fetchone()[0]

        # Calculate followings count
        cursor.execute("SELECT COUNT(*) AS followings_count FROM followings WHERE user_id = %s", (user_id,))
        followings_count = cursor.fetchone()[0]

        # Count poetry posts
        cursor.execute("SELECT COUNT(*) AS poetry_count FROM poem_post WHERE user_id = %s", (user_id,))
        poetry_count = cursor.fetchone()[0]

        # Get image_url
        cursor.execute("SELECT image_url FROM image WHERE user_id = %s", (user_id,))
        image_result = cursor.fetchone()
        image_url = image_result[0] if image_result else 'false'

        cursor.close()
        connection.close()

        return jsonify({
            'username': username,
            'bio': bio,
            'followers_count': followers_count,
            'followings_count': followings_count,
            'poetry_count': poetry_count,
            'image_url': image_url
        }), 200

    except mysql.connector.Error as error:
        print('Error executing SQL query:', error)
        return jsonify({'message': 'Error executing SQL query'}), 500







@app.route('/poetry_by_user', methods=['POST'])
def display_poetry_by_user():
    data = request.get_json()
    user_id = data.get('user_id')

    if user_id is None:
        return jsonify({'message': 'Invalid input data'}), 400

    connection = connect_to_database()
    if connection is None:
        return jsonify({'message': 'Error connecting to the database'}), 500

    try:
        cursor = connection.cursor()

        cursor.execute("""
            SELECT 
                pp.poetry_id, pp.username, pp.title, pp.poem_text, 
                pp.like_count, pp.comment_count, pp.user_id, pp.poet_name,
                lp.poetry_id IS NOT NULL AS isLiked,
                f.following_id IS NOT NULL AS isFollowing,
                pc.id AS collection_id,
                CASE WHEN pc.id IS NOT NULL THEN 1 ELSE 0 END AS isCollected,
                COALESCE(i.image_url, 'false') AS image_url
            FROM poem_post pp
            LEFT JOIN liked_poems lp ON pp.poetry_id = lp.poetry_id AND lp.user_id = %s
            LEFT JOIN followings f ON pp.user_id = f.following_id AND f.user_id = %s
            LEFT JOIN poem_collection pc ON pp.poetry_id = pc.poetry_id AND pc.user_id = %s
            LEFT JOIN image i ON pp.user_id = i.user_id
            WHERE pp.user_id = %s
            ORDER BY pp.poetry_id DESC
        """, (user_id, user_id, user_id, user_id))

        results = cursor.fetchall()

        cursor.close()
        connection.close()

        output = []
        for row in results:
            data = {
                'poetry_id': row[0],
                'username': row[1],
                'title': row[2],
                'poem_text': row[3],
                'like_count': row[4],
                'comment_count': row[5],
                'user_id': row[6],
                'poet_name': row[7],
                'isLiked': row[8],
                'isFollowing': row[9],
                'collection_id': row[10],
                'isCollected': row[11],
                'image_url': row[12]
            }
            output.append(data)

        return jsonify(output)

    except mysql.connector.Error as error:
        print(f'Error executing SQL query: {error}')
        return jsonify({'message': 'Error executing SQL query'}), 500





@app.route('/collection_lists', methods=['POST'])
def display_collection_lists():
    data = request.get_json()
    user_id = data.get('user_id')

    if user_id is None:
        return jsonify({'message': 'Invalid input data'}), 400

    connection = connect_to_database()
    if connection is None:
        return jsonify({'message': 'Error connecting to the database'}), 500

    try:
        cursor = connection.cursor()
        cursor.execute("""
            SELECT cl.id, cl.list_name, cl.intro, cl.user_id, u.username, icl.image_url,
                   CASE WHEN sc.id IS NOT NULL THEN TRUE ELSE FALSE END AS isSaved
            FROM collection_lists cl
            JOIN users u ON cl.user_id = u.id
            LEFT JOIN image_collection_list icl ON cl.id = icl.list_id
            LEFT JOIN saved_collections sc ON cl.id = sc.collection_id AND sc.user_id = %s
            WHERE cl.user_id = %s
        """, (user_id, user_id))

        results = cursor.fetchall()
        cursor.close()
        connection.close()

        output = []
        for row in results:
            data = {
                'id': row[0],
                'list_name': row[1],
                'intro': row[2],
                'user_id': row[3],
                'username': row[4],
                'image_url': row[5] if row[5] is not None else False,
                'isSaved': row[6]
            }
            output.append(data)

        return jsonify(output)

    except mysql.connector.Error as error:
        print('Error executing SQL query:', error)
        return jsonify({'message': 'Error executing SQL query'}), 500







@app.route('/poem_collection/<int:list_id>')
def display_poem_collection(list_id):
    # Connect to the database
    connection = connect_to_database()
    if connection is None:
        return 'Error connecting to the database'

    try:
        # Create a cursor object
        cursor = connection.cursor()

        # Execute an SQL query with a WHERE clause to filter by list_id
        cursor.execute("SELECT * FROM poem_collection WHERE list_id = %s", (list_id,))

        # Fetch the results
        results = cursor.fetchall()

        # Close the cursor and connection
        cursor.close()
        connection.close()

        # Convert the results to JSON format
        output = []
        for row in results:
            data = {
                'id': row[0],
                'user_id': row[1],
                'poetry_id': row[2],
                'list_id': row[3]
            }
            output.append(data)

        return jsonify(output)

    except mysql.connector.Error as error:
        print('Error executing SQL query:', error)
        return 'Error executing SQL query'





@app.route('/poetry_by_id', methods=['POST'])
def display_poetry_by_id():
    data = request.get_json()
    poetry_id = data.get('poetry_id')
    user_id = data.get('user_id')

    if poetry_id is None or user_id is None:
        return jsonify({'message': 'Invalid input data'}), 400

    connection = connect_to_database()
    if connection is None:
        return jsonify({'message': 'Error connecting to the database'}), 500

    try:
        cursor = connection.cursor()

        cursor.execute("""
            SELECT 
                pp.poetry_id, pp.username, pp.title, pp.poem_text, 
                pp.like_count, pp.comment_count, pp.user_id, pp.poet_name,
                lp.poetry_id IS NOT NULL AS isLiked,
                f.following_id IS NOT NULL AS isFollowing,
                pc.id AS collection_id,
                CASE WHEN pc.id IS NOT NULL THEN 1 ELSE 0 END AS isCollected,
                COALESCE(img.image_url, 'false') AS image_url
            FROM poem_post pp
            LEFT JOIN liked_poems lp ON pp.poetry_id = lp.poetry_id AND lp.user_id = %s
            LEFT JOIN followings f ON pp.user_id = f.following_id AND f.user_id = %s
            LEFT JOIN poem_collection pc ON pp.poetry_id = pc.poetry_id AND pc.user_id = %s
            LEFT JOIN image img ON pp.user_id = img.user_id
            WHERE pp.poetry_id = %s
        """, (user_id, user_id, user_id, poetry_id))

        results = cursor.fetchall()

        cursor.close()
        connection.close()

        output = []
        for row in results:
            data = {
                'poetry_id': row[0],
                'username': row[1],
                'title': row[2],
                'poem_text': row[3],
                'like_count': row[4],
                'comment_count': row[5],
                'user_id': row[6],
                'poet_name': row[7],
                'isLiked': row[8],
                'isFollowing': row[9],
                'collection_id': row[10],
                'isCollected': row[11],
                'image_url': row[12]
            }
            output.append(data)

        return jsonify(output)

    except mysql.connector.Error as error:
        print('Error executing SQL query:', error)
        return jsonify({'message': 'Error executing SQL query'}), 500





@app.route('/poetry_by_keyword', methods=['POST'])
def display_result_poem():
    data = request.json
    key_word = data.get('key_word')
    user_id = data.get('user_id')

    if not key_word or not user_id:
        return jsonify({'message': 'Missing key_word or user_id'}), 400

    connection = connect_to_database()
    if connection is None:
        return jsonify({'message': 'Error connecting to the database'}), 500

    try:
        cursor = connection.cursor()

        cursor.execute("""
            SELECT 
                pp.poetry_id, pp.username, pp.title, pp.poem_text, 
                pp.like_count, pp.comment_count, pp.user_id, pp.poet_name,
                lp.poetry_id IS NOT NULL AS isLiked,
                f.following_id IS NOT NULL AS isFollowing,
                pc.id AS collection_id,
                CASE WHEN pc.id IS NOT NULL THEN 1 ELSE 0 END AS isCollected,
                i.image_url
            FROM poem_post pp
            LEFT JOIN liked_poems lp ON pp.poetry_id = lp.poetry_id AND lp.user_id = %s
            LEFT JOIN followings f ON pp.user_id = f.following_id AND f.user_id = %s
            LEFT JOIN poem_collection pc ON pp.poetry_id = pc.poetry_id AND pc.user_id = %s
            LEFT JOIN image i ON pp.user_id = i.user_id
            WHERE pp.username LIKE %s OR pp.title LIKE %s OR pp.poem_text LIKE %s OR pp.poet_name LIKE %s
            ORDER BY pp.poetry_id DESC
        """, (user_id, user_id, user_id, f"%{key_word}%", f"%{key_word}%", f"%{key_word}%", f"%{key_word}%"))

        results = cursor.fetchall()

        cursor.close()
        connection.close()

        output = []
        for row in results:
            data = {
                'poetry_id': row[0],
                'username': row[1],
                'title': row[2],
                'poem_text': row[3],
                'like_count': row[4],
                'comment_count': row[5],
                'user_id': row[6],
                'poet_name': row[7],
                'isLiked': row[8],
                'isFollowing': row[9],
                'collection_id': row[10],
                'isCollected': row[11],
                'image_url': row[12] if row[12] else 'false'
            }
            output.append(data)

        return jsonify(output)

    except mysql.connector.Error as error:
        print(f'Error executing SQL query: {error}')
        return jsonify({'message': 'Error executing SQL query'}), 500









@app.route('/user_by_keyword', methods=['POST'])
def display_result_user():
    # Receive data from the POST request
    data = request.get_json()
    key_word = data.get('key_word')
    user_id = data.get('user_id')

    if not key_word or user_id is None:
        return 'Invalid input data'

    # Connect to the database
    connection = connect_to_database()
    if connection is None:
        return 'Error connecting to the database'

    try:
        # Create a cursor object
        cursor = connection.cursor()

        # Execute an SQL query to search for users, check following status, and get image_url
        query = """
            SELECT 
                u.id, u.username, u.bio, 
                IF(f.following_id IS NULL, 0, 1) AS isFollowing,
                COALESCE(i.image_url, 'false') AS image_url
            FROM users u
            LEFT JOIN followings f ON u.id = f.following_id AND f.user_id = %s
            LEFT JOIN image i ON u.id = i.user_id
            WHERE u.username LIKE %s OR u.bio LIKE %s
        """
        keyword_pattern = f"%{key_word}%"
        cursor.execute(query, (user_id, keyword_pattern, keyword_pattern))

        # Fetch the results
        results = cursor.fetchall()

        # Close the cursor and connection
        cursor.close()
        connection.close()

        # Convert the results to JSON format
        output = []
        for row in results:
            data = {
                'id': row[0],
                'username': row[1],
                'bio': row[2],
                'isFollowing': bool(row[3]),
                'image_url': row[4]
            }
            output.append(data)

        return jsonify(output)

    except mysql.connector.Error as error:
        print('Error executing SQL query:', error)
        return 'Error executing SQL query'




@app.route('/collection_by_keyword', methods=['POST'])
def display_result_collection():
    data = request.get_json()
    keyword = data.get('keyword')
    user_id = data.get('user_id')

    if not keyword or user_id is None:
        return jsonify({'message': 'Invalid input data'}), 400

    connection = connect_to_database()
    if connection is None:
        return jsonify({'message': 'Error connecting to the database'}), 500

    try:
        cursor = connection.cursor()
        query = """
            SELECT cl.id, cl.list_name, cl.intro, cl.user_id, u.username, 
                   icl.image_url, 
                   CASE WHEN sc.id IS NOT NULL THEN TRUE ELSE FALSE END AS isSaved
            FROM collection_lists cl
            JOIN users u ON cl.user_id = u.id
            LEFT JOIN image_collection_list icl ON cl.id = icl.list_id
            LEFT JOIN saved_collections sc ON cl.id = sc.collection_id AND sc.user_id = %s
            WHERE cl.list_name LIKE %s OR cl.intro LIKE %s
        """
        keyword_pattern = f"%{keyword}%"
        cursor.execute(query, (user_id, keyword_pattern, keyword_pattern))

        results = cursor.fetchall()
        cursor.close()
        connection.close()

        output = []
        for row in results:
            output.append({
                'id': row[0],
                'list_name': row[1],
                'intro': row[2],
                'user_id': row[3],
                'username': row[4],
                'image_url': row[5] if row[5] is not None else False,
                'isSaved': row[6]
            })

        return jsonify(output)

    except mysql.connector.Error as error:
        print('Error executing SQL query:', error)
        return jsonify({'message': 'Error executing SQL query'}), 500







@app.route('/like_poem', methods=['POST'])
def like_poem():
    if request.method == 'POST':
        data = request.get_json()
        user_id = data.get('userId')
        poetry_id = data.get('poetryId')

        connection = connect_to_database()
        if connection is None:
            return jsonify({'message': 'Error connecting to the database'}), 500

        try:
            cursor = connection.cursor()

            # Check if a record for the user and poetry post already exists
            cursor.execute("SELECT * FROM liked_poems WHERE user_id = %s AND poetry_id = %s",
                           (user_id, poetry_id))
            existing_like = cursor.fetchone()

            if existing_like:
                # If the record already exists, return a message indicating it's already liked
                return jsonify({'message': 'Poem already liked by this user'}), 400
            else:
                # If the record doesn't exist, insert it (like)
                cursor.execute("INSERT INTO liked_poems (user_id, poetry_id) VALUES (%s, %s)",
                               (user_id, poetry_id))
                
                # Update like_count in poem_post by increasing it by 1
                cursor.execute("UPDATE poem_post SET like_count = like_count + 1 WHERE poetry_id = %s", (poetry_id,))
                
                
                connection.commit()

            cursor.close()
            connection.close()

            return jsonify({'message': 'Like updated successfully'}), 200

        except mysql.connector.Error as error:
            print(f'Error executing SQL query: {error}')
            return jsonify({'message': 'Error executing SQL query'}), 500







@app.route('/like_poem_cancel', methods=['POST'])
def check_like_cancel():
    data = request.get_json()
    user_id = data.get('userId')
    poetry_id = data.get('poetryId')

    connection = connect_to_database()
    if connection is None:
        return jsonify({'message': 'Error connecting to the database'}), 500

    try:
        cursor = connection.cursor()

        # Check if a record for the user and poetry post already exists
        cursor.execute("SELECT * FROM liked_poems WHERE user_id = %s AND poetry_id = %s",
                       (user_id, poetry_id))
        existing_like = cursor.fetchone()

        if existing_like is not None:
            # If the record exists, delete it
            cursor.execute("DELETE FROM liked_poems WHERE user_id = %s AND poetry_id = %s",
                           (user_id, poetry_id))
            
            # Update like_count in poem_post by reducing it by 1
            cursor.execute("UPDATE poem_post SET like_count = like_count - 1 WHERE poetry_id = %s", (poetry_id,))
            
            connection.commit()

        cursor.close()
        connection.close()

        return jsonify({'message': 'Like canceled'}), 200

    except mysql.connector.Error as error:
        print(f'Error executing SQL query: {error}')
        return jsonify({'message': 'Error executing SQL query'}), 500






@app.route('/check_like', methods=['POST'])
def check_like():
    data = request.get_json()
    user_id = data.get('userId')
    poetry_id = data.get('poetryId')

    connection = connect_to_database()
    if connection is None:
        return jsonify({'message': 'Error connecting to the database'}), 500

    try:
        cursor = connection.cursor()

        # Check if a record for the user and poetry post already exists
        cursor.execute("SELECT * FROM liked_poems WHERE user_id = %s AND poetry_id = %s",
                       (user_id, poetry_id))
        existing_like = cursor.fetchone()

        is_liked = existing_like is not None

        cursor.close()
        connection.close()

        return jsonify({'isLiked': is_liked}), 200

    except mysql.connector.Error as error:
        print(f'Error executing SQL query: {error}')
        return jsonify({'message': 'Error executing SQL query'}), 500





@app.route('/submit_comment', methods=['POST'])
def submit_comment():
    if request.method == 'POST':
        data = request.get_json()
        print('Received data:', data)
        user_id = data.get('userId')
        username = data.get('username')
        comment_text = data.get('commentText')
        poetry_id = data.get('poetryId')

        connection = connect_to_database()
        if connection is None:
            print('connection error')
            return jsonify({'message': 'Error connecting to the database'}), 500

        try:
            cursor = connection.cursor()

            print('before insert')
            # Insert the comment with like_count and dislike_count set to 0
            cursor.execute(
                "INSERT INTO comment (user_id, username, comment_text, like_count, dislike_count, poetry_id) VALUES (%s, %s, %s, %s, %s, %s)",
                (user_id, username, comment_text, 0, 0, poetry_id))
            
            # Update comment_count in poem_post by increasing it by 1
            cursor.execute("UPDATE poem_post SET comment_count = comment_count + 1 WHERE poetry_id = %s", (poetry_id,))
            
            connection.commit()
            print('after insert')

            cursor.close()
            connection.close()

            return jsonify({'message': 'Comment submitted successfully'}), 200

        except mysql.connector.Error as error:
            print(f'Error executing SQL query: {error}')
            return jsonify({'message': 'Error executing SQL query'}), 500








@app.route('/like_comment', methods=['POST'])
def like_comment():
    if request.method == 'POST':
        data = request.get_json()
        user_id = data.get('userId')
        comment_id = data.get('commentId')

        connection = connect_to_database()
        if connection is None:
            return jsonify({'message': 'Error connecting to the database'}), 500

        try:
            cursor = connection.cursor()

            # Check if a record for the user and comment already exists
            cursor.execute("SELECT * FROM liked_comment WHERE user_id = %s AND comment_id = %s",
                           (user_id, comment_id))
            existing_like = cursor.fetchone()

            if existing_like:
                # If the record already exists, return a message indicating it's already liked
                return jsonify({'message': 'Comment already liked by this user'}), 400
            else:
                # If the record doesn't exist, insert it (like)
                cursor.execute("INSERT INTO liked_comment (user_id, comment_id) VALUES (%s, %s)",
                               (user_id, comment_id))

                # Increment the like_count in the comment table
                cursor.execute("UPDATE comment SET like_count = like_count + 1 WHERE comment_id = %s", (comment_id,))
                connection.commit()

            cursor.close()
            connection.close()

            return jsonify({'message': 'Comment liked successfully'}), 200

        except mysql.connector.Error as error:
            print(f'Error executing SQL query: {error}')
            return jsonify({'message': 'Error executing SQL query'}), 500






@app.route('/cancel_like_comment', methods=['POST'])
def cancel_like_comment():
    data = request.get_json()
    user_id = data.get('userId')
    comment_id = data.get('commentId')

    connection = connect_to_database()
    if connection is None:
        return jsonify({'message': 'Error connecting to the database'}), 500

    try:
        cursor = connection.cursor()

        # Check if a record for the user and comment already exists
        cursor.execute("SELECT * FROM liked_comment WHERE user_id = %s AND comment_id = %s",
                       (user_id, comment_id))
        existing_like = cursor.fetchone()

        if existing_like is not None:
            # If the record exists, delete it
            cursor.execute("DELETE FROM liked_comment WHERE user_id = %s AND comment_id = %s",
                           (user_id, comment_id))
            connection.commit()

            # Decrement the like_count in the comment table
            cursor.execute("UPDATE comment SET like_count = GREATEST(like_count - 1, 0) WHERE comment_id = %s", (comment_id,))
            connection.commit()

        cursor.close()
        connection.close()

        return jsonify({'message': 'Like on comment canceled'}), 200

    except mysql.connector.Error as error:
        print(f'Error executing SQL query: {error}')
        return jsonify({'message': 'Error executing SQL query'}), 500





@app.route('/check_like_comment', methods=['POST'])
def check_like_comment():
    data = request.get_json()
    user_id = data.get('userId')
    comment_id = data.get('commentId')

    connection = connect_to_database()
    if connection is None:
        return jsonify({'message': 'Error connecting to the database'}), 500

    try:
        cursor = connection.cursor()

        # Check if a record for the user and comment already exists
        cursor.execute("SELECT * FROM liked_comment WHERE user_id = %s AND comment_id = %s",
                       (user_id, comment_id))
        existing_like = cursor.fetchone()

        is_liked = existing_like is not None

        cursor.close()
        connection.close()

        return jsonify({'isLiked': is_liked}), 200

    except mysql.connector.Error as error:
        print(f'Error executing SQL query: {error}')
        return jsonify({'message': 'Error executing SQL query'}), 500





@app.route('/dislike_comment', methods=['POST'])
def dislike_comment():
    data = request.get_json()
    user_id = data.get('userId')
    comment_id = data.get('commentId')

    connection = connect_to_database()
    if connection is None:
        return jsonify({'message': 'Error connecting to the database'}), 500

    try:
        cursor = connection.cursor()

        # Check if a record for the user and comment already exists
        cursor.execute("SELECT * FROM disliked_comment WHERE user_id = %s AND comment_id = %s",
                       (user_id, comment_id))
        existing_dislike = cursor.fetchone()

        if existing_dislike:
            # If the record already exists, return a message indicating it's already disliked
            return jsonify({'message': 'Comment already disliked by this user'}), 400
        else:
            # If the record doesn't exist, insert it (dislike)
            cursor.execute("INSERT INTO disliked_comment (user_id, comment_id) VALUES (%s, %s)",
                           (user_id, comment_id))
            connection.commit()

            # Increment the dislike_count in the comment table
            cursor.execute("UPDATE comment SET dislike_count = dislike_count + 1 WHERE comment_id = %s", (comment_id,))
            connection.commit()

        cursor.close()
        connection.close()

        return jsonify({'message': 'Comment disliked successfully'}), 200

    except mysql.connector.Error as error:
        print(f'Error executing SQL query: {error}')
        return jsonify({'message': 'Error executing SQL query'}), 500






@app.route('/cancel_dislike_comment', methods=['POST'])
def cancel_dislike_comment():
    data = request.get_json()
    user_id = data.get('userId')
    comment_id = data.get('commentId')

    connection = connect_to_database()
    if connection is None:
        return jsonify({'message': 'Error connecting to the database'}), 500

    try:
        cursor = connection.cursor()

        # Check if a record for the user and comment already exists
        cursor.execute("SELECT * FROM disliked_comment WHERE user_id = %s AND comment_id = %s",
                       (user_id, comment_id))
        existing_dislike = cursor.fetchone()

        if existing_dislike is not None:
            # If the record exists, delete it (cancel dislike)
            cursor.execute("DELETE FROM disliked_comment WHERE user_id = %s AND comment_id = %s",
                           (user_id, comment_id))
            connection.commit()

            # Decrement the dislike_count in the comment table
            cursor.execute("UPDATE comment SET dislike_count = GREATEST(dislike_count - 1, 0) WHERE comment_id = %s", (comment_id,))
            connection.commit()

        cursor.close()
        connection.close()

        return jsonify({'message': 'Dislike on comment canceled'}), 200

    except mysql.connector.Error as error:
        print(f'Error executing SQL query: {error}')
        return jsonify({'message': 'Error executing SQL query'}), 500






@app.route('/check_dislike_comment', methods=['POST'])
def check_dislike_comment():
    data = request.get_json()
    user_id = data.get('userId')
    comment_id = data.get('commentId')

    connection = connect_to_database()
    if connection is None:
        return jsonify({'message': 'Error connecting to the database'}), 500

    try:
        cursor = connection.cursor()

        # Check if a record for the user and comment already exists
        cursor.execute("SELECT * FROM disliked_comment WHERE user_id = %s AND comment_id = %s",
                       (user_id, comment_id))
        existing_dislike = cursor.fetchone()

        is_disliked = existing_dislike is not None

        cursor.close()
        connection.close()

        return jsonify({'isDisliked': is_disliked}), 200

    except mysql.connector.Error as error:
        print(f'Error executing SQL query: {error}')
        return jsonify({'message': 'Error executing SQL query'}), 500





@app.route('/follow', methods=['POST'])
def follow():
    data = request.get_json()
    user_id = data.get('userId')
    following_id = data.get('followingId')

    connection = connect_to_database()
    if connection is None:
        return jsonify({'message': 'Error connecting to the database'}), 500

    try:
        cursor = connection.cursor()

        # Check if a record for the user and following user already exists
        cursor.execute("SELECT * FROM followings WHERE user_id = %s AND following_id = %s",
                       (user_id, following_id))
        existing_follow = cursor.fetchone()

        if existing_follow:
            # If the record already exists, return a message indicating they are already following
            return jsonify({'message': 'User already follows this user'}), 400
        else:
            # If the record doesn't exist, insert it (follow)
            cursor.execute("INSERT INTO followings (user_id, following_id) VALUES (%s, %s)",
                           (user_id, following_id))
            cursor.execute("INSERT INTO followers (user_id, follower_id) VALUES (%s, %s)",
                           (following_id, user_id))
            connection.commit()

        # Check if they follow each other
        cursor.execute("SELECT * FROM followings WHERE user_id = %s AND following_id = %s",
                       (following_id, user_id))
        follow_each_other = cursor.fetchone()

        if follow_each_other:
            # If they follow each other, add a record in chat_friends
            cursor.execute("INSERT INTO chat_friends (user_id_one, user_id_two) VALUES (%s, %s)",
                           (user_id, following_id))
            connection.commit()

        cursor.close()
        connection.close()

        return jsonify({'message': 'User followed successfully'}), 200

    except mysql.connector.Error as error:
        print(f'Error executing SQL query: {error}')
        return jsonify({'message': 'Error executing SQL query'}), 500






@app.route('/follow_cancel', methods=['POST'])
def follow_cancel():
    data = request.get_json()
    user_id = data.get('userId')
    following_id = data.get('followingId')

    connection = connect_to_database()
    if connection is None:
        return jsonify({'message': 'Error connecting to the database'}), 500

    try:
        cursor = connection.cursor()

        # Check if a record for the user and following user already exists in followings
        cursor.execute("SELECT * FROM followings WHERE user_id = %s AND following_id = %s", (user_id, following_id))
        existing_follow = cursor.fetchone()

        if existing_follow is not None:
            # If the record exists in followings, delete it (unfollow)
            cursor.execute("DELETE FROM followings WHERE user_id = %s AND following_id = %s", (user_id, following_id))
            cursor.execute("DELETE FROM followers WHERE user_id = %s AND follower_id = %s", (following_id, user_id))

            # Find the chat_id in chat_friends
            cursor.execute("""
                SELECT id FROM chat_friends 
                WHERE (user_id_one = %s AND user_id_two = %s) OR (user_id_one = %s AND user_id_two = %s)
            """, (user_id, following_id, following_id, user_id))
            chat_friends_record = cursor.fetchone()

            if chat_friends_record is not None:
                chat_id = chat_friends_record[0]

                # Delete all chat messages associated with this chat_id
                cursor.execute("DELETE FROM chat_messages WHERE chat_id = %s", (chat_id,))

                # Delete the chat_friends record
                cursor.execute("""
                    DELETE FROM chat_friends 
                    WHERE (user_id_one = %s AND user_id_two = %s) OR (user_id_one = %s AND user_id_two = %s)
                """, (user_id, following_id, following_id, user_id))

            connection.commit()

        cursor.close()
        connection.close()

        return jsonify({'message': 'Unfollowed successfully'}), 200

    except mysql.connector.Error as error:
        print(f'Error executing SQL query: {error}')
        return jsonify({'message': 'Error executing SQL query'}), 500








@app.route('/check_follow', methods=['POST'])
def check_follow():
    data = request.get_json()
    user_id = data.get('userId')
    following_id = data.get('followingId')

    connection = connect_to_database()
    if connection is None:
        return jsonify({'message': 'Error connecting to the database'}), 500

    try:
        cursor = connection.cursor()

        # Check if a record for the user and following user already exists
        cursor.execute("SELECT * FROM followings WHERE user_id = %s AND following_id = %s",
                       (user_id, following_id))
        existing_follow = cursor.fetchone()

        is_following = existing_follow is not None

        cursor.close()
        connection.close()

        return jsonify({'isFollowing': is_following}), 200

    except mysql.connector.Error as error:
        print(f'Error executing SQL query: {error}')
        return jsonify({'message': 'Error executing SQL query'}), 500





@app.route('/get_followers_list', methods=['POST'])
def get_followers_list():
    data = request.json
    user_id_login = data.get('user_id_login')
    user_id = data.get('user_id')

    connection = connect_to_database()
    if connection is None:
        return 'Error connecting to the database'

    try:
        cursor = connection.cursor()
        # Query to retrieve all follower IDs for the given user
        query = "SELECT follower_id FROM followers WHERE user_id = %s"
        cursor.execute(query, (user_id,))
        follower_ids = cursor.fetchall()

        followers_list = []

        for follower_id in follower_ids:
            follower_id = follower_id[0]
            # Query to retrieve id, username, and bio of the follower
            query = "SELECT id, username, bio FROM users WHERE id = %s"
            cursor.execute(query, (follower_id,))
            follower_info = cursor.fetchone()

            # Query to check if the follower has an image
            query = "SELECT image_url FROM image WHERE user_id = %s LIMIT 1"
            cursor.execute(query, (follower_id,))
            image_info = cursor.fetchone()
            image_url = image_info[0] if image_info else False

            # Check if the logged-in user is following this follower
            query = "SELECT COUNT(*) FROM followings WHERE user_id = %s AND following_id = %s"
            cursor.execute(query, (user_id_login, follower_id))
            is_following = cursor.fetchone()[0] > 0

            if follower_info:
                user_id, username, bio = follower_info
                followers_list.append({
                    'id': user_id,
                    'username': username,
                    'bio': bio,
                    'image_url': image_url,
                    'isFollowing': is_following
                })

        cursor.close()
        connection.close()

        return jsonify(followers_list)

    except mysql.connector.Error as error:
        print('Error executing SQL query:', error)
        return 'Error executing SQL query'

    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()





@app.route('/get_following_list', methods=['POST'])
def get_following_list():
    # Extracting data from the request's JSON body
    data = request.json
    user_id_login = data.get('user_id_login')
    user_id = data.get('user_id')

    connection = connect_to_database()
    if connection is None:
        return 'Error connecting to the database'

    try:
        cursor = connection.cursor()
        # Query to retrieve all following IDs for the given user
        query = "SELECT following_id FROM followings WHERE user_id = %s"
        cursor.execute(query, (user_id,))
        following_ids = cursor.fetchall()

        following_list = []

        for following_id in following_ids:
            following_id = following_id[0]
            # Query to retrieve id, username, and bio of the followed users
            query = "SELECT id, username, bio FROM users WHERE id = %s"
            cursor.execute(query, (following_id,))
            following_info = cursor.fetchone()

            # Query to check if the followed user has an image
            query = "SELECT image_url FROM image WHERE user_id = %s LIMIT 1"
            cursor.execute(query, (following_id,))
            image_info = cursor.fetchone()
            image_url = image_info[0] if image_info else False

            # Check if the logged-in user is following this user
            query = "SELECT COUNT(*) FROM followings WHERE user_id = %s AND following_id = %s"
            cursor.execute(query, (user_id_login, following_id))
            is_following = cursor.fetchone()[0] > 0

            if following_info:
                user_id, username, bio = following_info
                following_list.append({
                    'id': user_id, 
                    'username': username, 
                    'bio': bio, 
                    'image_url': image_url, 
                    'isFollowing': is_following
                })

        cursor.close()
        connection.close()

        return jsonify(following_list)

    except mysql.connector.Error as error:
        print('Error executing SQL query:', error)
        return 'Error executing SQL query'

    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()







@app.route('/get_lists_by_user/<int:user_id>')
def get_lists_by_user(user_id):
    connection = connect_to_database()
    if connection is None:
        return 'Error connecting to the database'

    try:
        cursor = connection.cursor()
        # Query to retrieve all list names for the given user ID
        query = "SELECT id, list_name, intro FROM collection_lists WHERE user_id = %s"
        cursor.execute(query, (user_id,))
        lists_data = cursor.fetchall()

        # Initialize an empty list to store list details
        user_lists = []

        # Loop through the retrieved data
        for list_data in lists_data:
            list_id, list_name, intro = list_data
            # Append list information to the list
            user_lists.append({'id': list_id, 'list_name': list_name, 'intro': intro})

        cursor.close()
        connection.close()

        return jsonify(user_lists)

    except mysql.connector.Error as error:
        print('Error executing SQL query:', error)
        return 'Error executing SQL query'





@app.route('/check_poetry_collection', methods=['POST'])
def check_poetry_collection():
    data = request.get_json()
    user_id = data.get('userId')
    poetry_id = data.get('poetryId')

    connection = connect_to_database()
    if connection is None:
        return jsonify({'message': 'Error connecting to the database'}), 500

    try:
        cursor = connection.cursor()

        # Check if a record for the user and poetry ID exists in poem_collection
        cursor.execute("SELECT list_id FROM poem_collection WHERE user_id = %s AND poetry_id = %s",
                       (user_id, poetry_id))
        collection_record = cursor.fetchone()

        is_collected = False

        if collection_record:
            is_collected = True

        cursor.close()
        connection.close()

        response_data = {'isCollected': is_collected}
        return jsonify(response_data), 200

    except mysql.connector.Error as error:
        print(f'Error executing SQL query: {error}')
        return jsonify({'message': 'Error executing SQL query'}), 500





@app.route('/delete_poetry_collection', methods=['POST'])
def delete_poetry_collection():
    data = request.get_json()
    user_id = data.get('userId')
    poetry_id = data.get('poetryId')

    connection = connect_to_database()
    if connection is None:
        return jsonify({'message': 'Error connecting to the database'}), 500

    try:
        cursor = connection.cursor()

        # Delete the record where user_id and poetry_id match
        cursor.execute("DELETE FROM poem_collection WHERE user_id = %s AND poetry_id = %s",
                       (user_id, poetry_id))

        # Commit the changes to the database
        connection.commit()

        cursor.close()
        connection.close()

        return jsonify({'message': 'Record deleted successfully'}), 200

    except mysql.connector.Error as error:
        print(f'Error executing SQL query: {error}')
        return jsonify({'message': 'Error executing SQL query'}), 500





@app.route('/add_poetry_to_collection', methods=['POST'])
def add_poetry_to_collection():
    data = request.get_json()
    user_id = data.get('userId')
    poetry_id = data.get('poetryId')
    list_id = data.get('listId')  # Assuming you pass the list ID from the frontend

    connection = connect_to_database()
    if connection is None:
        return jsonify({'message': 'Error connecting to the database'}), 500

    try:
        cursor = connection.cursor()

        # Insert a new record into the poem_collection table
        cursor.execute("INSERT INTO poem_collection (user_id, poetry_id, list_id) VALUES (%s, %s, %s)",
                       (user_id, poetry_id, list_id))

        # Commit the changes to the database
        connection.commit()

        cursor.close()
        connection.close()

        return jsonify({'message': 'Record added successfully'}), 200

    except mysql.connector.Error as error:
        print(f'Error executing SQL query: {error}')
        return jsonify({'message': 'Error executing SQL query'}), 500





@app.route('/update_user_profile/<int:user_id>', methods=['POST'])
def update_user_profile(user_id):
    connection = connect_to_database()
    if connection is None:
        return jsonify({'message': 'Error connecting to the database'}), 500

    try:
        cursor = connection.cursor()

        # Get the new username and bio from the request JSON data
        data = request.get_json()
        new_username = data.get('new_username')
        new_bio = data.get('new_bio')

        if not new_username or not new_bio:
            return jsonify({'message': 'New username and bio are required'}), 400

        # Update the 'username' field in the 'users' table
        cursor.execute("UPDATE users SET username = %s, bio = %s WHERE id = %s", (new_username, new_bio, user_id))

        # Update the 'username' field in the 'comment' table for the user's comments
        cursor.execute("UPDATE comment SET username = %s WHERE user_id = %s", (new_username, user_id))

        # Update the 'username' field in the 'poem_post' table for the user's poems
        cursor.execute("UPDATE poem_post SET username = %s WHERE user_id = %s", (new_username, user_id))

        connection.commit()

        cursor.close()
        connection.close()

        return jsonify({'message': 'User profile updated successfully'}), 200

    except mysql.connector.Error as error:
        print('Error executing SQL query:', error)
        return jsonify({'message': 'Error executing SQL query'}), 500






@app.route('/create_collection_list', methods=['POST'])
def create_collection_list():
    if request.method == 'POST':
        data = request.get_json()
        print('Received data:', data)
        user_id = data.get('userId')
        list_name = data.get('listName')
        intro = data.get('intro')

        connection = connect_to_database()
        if connection is None:
            print('connection error')
            return jsonify({'message': 'Error connecting to the database'}), 500

        try:
            cursor = connection.cursor()

            print('before insert')
            # Insert a new collection list record
            cursor.execute(
                "INSERT INTO collection_lists (user_id, list_name, intro) VALUES (%s, %s, %s)",
                (user_id, list_name, intro))
            connection.commit()
            print('after insert')

            cursor.close()
            connection.close()

            return jsonify({'message': 'Collection list created successfully'}), 200

        except mysql.connector.Error as error:
            print(f'Error executing SQL query: {error}')
            return jsonify({'message': 'Error executing SQL query'}), 500





@app.route('/insert_poem', methods=['POST'])
def insert_poem():
    # Get data from the request
    data = request.get_json()
    
    # Extract values from the request JSON
    username = data.get('username')
    title = data.get('title')
    poem_text = data.get('poem_text')
    user_id = data.get('user_id')
    poet_name = data.get('poet_name')

    # Connect to the database
    connection = connect_to_database()
    if connection is None:
        return 'Error connecting to the database'

    try:
        # Create a cursor object
        cursor = connection.cursor()

        # Insert a new record into the poem_post table
        cursor.execute(
            "INSERT INTO poem_post (username, title, poem_text, like_count, comment_count, user_id, poet_name) VALUES (%s, %s, %s, 0, 0, %s, %s)",
            (username, title, poem_text, user_id, poet_name)
        )

        # Commit the transaction
        connection.commit()

        # Close the cursor and connection
        cursor.close()
        connection.close()

        return 'Record inserted successfully'

    except mysql.connector.Error as error:
        print('Error executing SQL query:', error)
        return 'Error executing SQL query'





@app.route('/delete_poem', methods=['POST'])
def delete_poem():
    # Get data from the request
    data = request.get_json()

    # Extract the poetry_id from the request JSON
    poetry_id_to_delete = data.get('poetry_id')

    # Log the received poetry_id for debugging
    print(f'Received poetry_id to delete: {poetry_id_to_delete}')

    # Connect to the database
    connection = connect_to_database()
    if connection is None:
        return 'Error connecting to the database'

    try:
        # Create a cursor object
        cursor = connection.cursor()

        # Check if there are records in the 'liked_poems' table for the poetry_id
        cursor.execute("SELECT * FROM liked_poems WHERE poetry_id = %s", (poetry_id_to_delete,))
        liked_poems_records = cursor.fetchall()

        # Check if there are records in the 'poem_collection' table for the poetry_id
        cursor.execute("SELECT * FROM poem_collection WHERE poetry_id = %s", (poetry_id_to_delete,))
        poem_collection_records = cursor.fetchall()

        # Delete records from the 'liked_poems' table where poetry_id matches
        if liked_poems_records:
            cursor.execute("DELETE FROM liked_poems WHERE poetry_id = %s", (poetry_id_to_delete,))

        # Delete records from the 'poem_collection' table where poetry_id matches
        if poem_collection_records:
            cursor.execute("DELETE FROM poem_collection WHERE poetry_id = %s", (poetry_id_to_delete,))

        # Check if there are records in the 'comment' table for the poetry_id
        cursor.execute("SELECT * FROM comment WHERE poetry_id = %s", (poetry_id_to_delete,))
        comment_records = cursor.fetchall()

        # Delete records from the 'comment' table where poetry_id matches
        if comment_records:
            # For each comment, check and delete associated records in liked_comment and disliked_comment tables
            for comment_record in comment_records:
                comment_id = comment_record[0]

                # Check and delete from liked_comment
                cursor.execute("SELECT * FROM liked_comment WHERE comment_id = %s", (comment_id,))
                if cursor.fetchone():
                    cursor.execute("DELETE FROM liked_comment WHERE comment_id = %s", (comment_id,))

                # Check and delete from disliked_comment
                cursor.execute("SELECT * FROM disliked_comment WHERE comment_id = %s", (comment_id,))
                if cursor.fetchone():
                    cursor.execute("DELETE FROM disliked_comment WHERE comment_id = %s", (comment_id,))

            # Delete records from the 'comment' table where poetry_id matches
            if comment_records:
                cursor.execute("DELETE FROM comment WHERE poetry_id = %s", (poetry_id_to_delete,))
                
            cursor.execute("DELETE FROM comment WHERE poetry_id = %s", (poetry_id_to_delete,))

        # Delete the poem record from the 'poem_post' table
        cursor.execute("DELETE FROM poem_post WHERE poetry_id = %s", (poetry_id_to_delete,))

        # Commit the changes to the database
        connection.commit()

        # Close the cursor and connection
        cursor.close()
        connection.close()

        return 'Record deleted successfully'

    except mysql.connector.Error as error:
        print('Error executing SQL query:', error)
        return 'Error executing SQL query'






@app.route('/delete_comment', methods=['POST'])
def delete_comment():
    # Get data from the request
    data = request.get_json()

    # Extract the comment_id and poetry_id from the request JSON
    comment_id_to_delete = data.get('comment_id')
    poetry_id = data.get('poetry_id')

    # Log the received comment_id and poetry_id for debugging
    print(f'Received comment_id to delete: {comment_id_to_delete}')
    print(f'Received poetry_id: {poetry_id}')

    # Connect to the database
    connection = connect_to_database()
    if connection is None:
        return 'Error connecting to the database'

    try:
        # Create a cursor object
        cursor = connection.cursor()

        # Check if there are records in the 'liked_comment' table for the comment_id
        cursor.execute("SELECT * FROM liked_comment WHERE comment_id = %s", (comment_id_to_delete,))
        liked_comment_records = cursor.fetchall()

        # Check if there are records in the 'disliked_comment' table for the comment_id
        cursor.execute("SELECT * FROM disliked_comment WHERE comment_id = %s", (comment_id_to_delete,))
        disliked_comment_records = cursor.fetchall()

        # Delete records from the 'liked_comment' table where comment_id matches
        if liked_comment_records:
            cursor.execute("DELETE FROM liked_comment WHERE comment_id = %s", (comment_id_to_delete,))

        # Delete records from the 'disliked_comment' table where comment_id matches
        if disliked_comment_records:
            cursor.execute("DELETE FROM disliked_comment WHERE comment_id = %s", (comment_id_to_delete,))

        # Delete the comment record from the 'comment' table
        cursor.execute("DELETE FROM comment WHERE comment_id = %s", (comment_id_to_delete,))

        # Decrement the 'comment_count' for the specified poem
        cursor.execute("UPDATE poem_post SET comment_count = comment_count - 1 WHERE poetry_id = %s", (poetry_id,))

        # Commit the changes to the database
        connection.commit()

        # Close the cursor and connection
        cursor.close()
        connection.close()

        return 'Record deleted successfully'

    except mysql.connector.Error as error:
        print('Error executing SQL query:', error)
        return 'Error executing SQL query'







@app.route('/get_chat_friends', methods=['POST'])
def get_chat_friends():
    data = request.json
    user_id = data.get('user_id')

    connection = connect_to_database()
    if connection is None:
        return jsonify({'message': 'Error connecting to the database'}), 500

    try:
        cursor = connection.cursor()

        # Query to retrieve chat friend information
        cursor.execute("""
            SELECT id, user_id_one, user_id_two 
            FROM chat_friends 
            WHERE user_id_one = %s OR user_id_two = %s
        """, (user_id, user_id))
        chat_friend_records = cursor.fetchall()

        chat_friends = []

        for record in chat_friend_records:
            chat_friend_id, user_id_one, user_id_two = record
            friend_id = user_id_two if user_id_one == user_id else user_id_one

            # Query to get the friend's username
            cursor.execute("SELECT id, username FROM users WHERE id = %s", (friend_id,))
            user_info = cursor.fetchone()

            # Query to get the latest message
            cursor.execute("""
                SELECT message 
                FROM chat_messages 
                WHERE chat_id = %s 
                ORDER BY id DESC 
                LIMIT 1
            """, (chat_friend_id,))
            latest_message_record = cursor.fetchone()
            latest_message = latest_message_record[0] if latest_message_record else False

            # Query to get the friend's image URL
            cursor.execute("SELECT image_url FROM image WHERE user_id = %s LIMIT 1", (friend_id,))
            image_record = cursor.fetchone()
            image_url = image_record[0] if image_record else False

            if user_info:
                friend_id, friend_name = user_info
                chat_friends.append({
                    'chat_friends_id': chat_friend_id, 
                    'friend_id': friend_id, 
                    'friend_name': friend_name, 
                    'latest_message': latest_message, 
                    'image_url': image_url
                })

        cursor.close()
        connection.close()

        return jsonify(chat_friends)

    except mysql.connector.Error as error:
        print(f'Error executing SQL query: {error}')
        return jsonify({'message': 'Error executing SQL query'}), 500






@app.route('/send_chat_message', methods=['POST'])
def send_chat_message():
    # Get data from the request
    data = request.get_json()

    # Extract the required fields from the request JSON
    sender_user_id = data.get('sender_user_id')
    receiver_user_id = data.get('receiver_user_id')
    chat_id = data.get('chat_id')
    message = data.get('message')

    # Connect to the database
    connection = connect_to_database()
    if connection is None:
        return jsonify({'message': 'Error connecting to the database'}), 500

    try:
        # Create a cursor object
        cursor = connection.cursor()

        # Execute an SQL query to insert a new chat message record
        insert_query = "INSERT INTO chat_messages (sender_user_id, receiver_user_id, chat_id, message) VALUES (%s, %s, %s, %s)"
        cursor.execute(insert_query, (sender_user_id, receiver_user_id, chat_id, message))

        # Commit the changes to the database
        connection.commit()

        # Close the cursor and connection
        cursor.close()
        connection.close()

        return 'Chat message sent successfully'

    except mysql.connector.Error as error:
        print('Error executing SQL query:', error)
        return jsonify({'message': 'Error executing SQL query'}), 500




@app.route('/get_chat_messages', methods=['POST'])
def get_chat_messages():
    data = request.get_json()
    chat_id = data.get('chatId')

    connection = connect_to_database()
    if connection is None:
        return jsonify({'message': 'Error connecting to the database'}), 500

    try:
        cursor = connection.cursor()

        # Query to retrieve all chat messages for the given chat ID
        query = "SELECT sender_user_id, receiver_user_id, message FROM chat_messages WHERE chat_id = %s"
        cursor.execute(query, (chat_id,))
        chat_messages = cursor.fetchall()

        # Initialize an empty list to store chat messages
        chat_messages_list = []

        # Loop through the retrieved chat messages
        for message_data in chat_messages:
            sender_user_id, receiver_user_id, message = message_data
            chat_messages_list.append({'sender_user_id': sender_user_id, 'receiver_user_id': receiver_user_id, 'message': message})

        cursor.close()
        connection.close()

        return jsonify(chat_messages_list)

    except mysql.connector.Error as error:
        print('Error executing SQL query:', error)
        return jsonify({'message': 'Error executing SQL query'}), 500





@app.route('/update_like_count/<int:poetry_id>')
def update_like_count(poetry_id):
    connection = connect_to_database()
    if connection is None:
        return jsonify({'message': 'Error connecting to the database'}), 500

    try:
        cursor = connection.cursor()

        # Count the number of records in liked_poems where poetry_id matches the input
        cursor.execute("SELECT COUNT(*) FROM liked_poems WHERE poetry_id = %s", (poetry_id,))
        like_count = cursor.fetchone()[0]

        # Update the like_count in poem_post for the given poetry_id
        cursor.execute("UPDATE poem_post SET like_count = %s WHERE poetry_id = %s", (like_count, poetry_id))

        # Commit the changes to the database
        connection.commit()

        cursor.close()
        connection.close()

        # Return the updated like count in the response
        return jsonify({'message': 'Like count updated successfully', 'like_count': like_count})

    except mysql.connector.Error as error:
        print('Error executing SQL query:', error)
        return jsonify({'message': 'Error executing SQL query'}), 500





@app.route('/update_comment_count/<int:poetry_id>')
def update_comment_count(poetry_id):
    connection = connect_to_database()
    if connection is None:
        return jsonify({'message': 'Error connecting to the database'}), 500

    try:
        cursor = connection.cursor()

        # Count the number of records in the comment table where poetry_id matches the input
        cursor.execute("SELECT COUNT(*) FROM comment WHERE poetry_id = %s", (poetry_id,))
        comment_count = cursor.fetchone()[0]

        # Update the comment_count in poem_post for the given poetry_id
        cursor.execute("UPDATE poem_post SET comment_count = %s WHERE poetry_id = %s", (comment_count, poetry_id))

        # Commit the changes to the database
        connection.commit()

        cursor.close()
        connection.close()

        # Return the updated comment_count in the response
        return jsonify({'message': 'Comment count updated successfully', 'comment_count': comment_count})

    except mysql.connector.Error as error:
        print('Error executing SQL query:', error)
        return jsonify({'message': 'Error executing SQL query'}), 500





@app.route('/update_comment_like_count/<int:comment_id>')
def update_comment_like_count(comment_id):
    connection = connect_to_database()
    if connection is None:
        return jsonify({'message': 'Error connecting to the database'}), 500

    try:
        cursor = connection.cursor()

        # Count the number of records in liked_comment where comment_id matches the input
        cursor.execute("SELECT COUNT(*) FROM liked_comment WHERE comment_id = %s", (comment_id,))
        like_count = cursor.fetchone()[0]

        # Update the like_count in comment for the given comment_id
        cursor.execute("UPDATE comment SET like_count = %s WHERE comment_id = %s", (like_count, comment_id))

        # Commit the changes to the database
        connection.commit()

        cursor.close()
        connection.close()

        # Return the updated like_count in the response
        return jsonify({'message': 'Like count updated successfully', 'like_count': like_count})

    except mysql.connector.Error as error:
        print('Error executing SQL query:', error)
        return jsonify({'message': 'Error executing SQL query'}), 500

    



@app.route('/update_comment_dislike_count/<int:comment_id>', methods=['GET'])
def update_comment_dislike_count(comment_id):
    connection = connect_to_database()
    if connection is None:
        return jsonify({'message': 'Error connecting to the database'}), 500

    try:
        cursor = connection.cursor()

        # Count the number of records in disliked_comment where comment_id matches the input
        cursor.execute("SELECT COUNT(*) FROM disliked_comment WHERE comment_id = %s", (comment_id,))
        dislike_count = cursor.fetchone()[0]

        # Update the dislike_count in the comment for the given comment_id
        cursor.execute("UPDATE comment SET dislike_count = %s WHERE comment_id = %s", (dislike_count, comment_id))

        # Commit the changes to the database
        connection.commit()

        cursor.close()
        connection.close()

        # Return the updated dislike_count in the response
        return jsonify({'message': 'Dislike count updated successfully', 'dislike_count': dislike_count})

    except mysql.connector.Error as error:
        print('Error executing SQL query:', error)
        return jsonify({'message': 'Error executing SQL query'}), 500





@app.route('/sign_up', methods=['POST'])
def sign_up():
    if request.method == 'POST':
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')

        # Set a default bio instead of taking it as input
        bio = "This user's story is still unwritten, a silent promise of tales yet to be told."

        connection = connect_to_database()
        if connection is None:
            return jsonify({'message': 'Error connecting to the database'}), 500

        try:
            cursor = connection.cursor()
            # Check if the username already exists
            cursor.execute("SELECT * FROM users WHERE username = %s", (username,))
            existing_user = cursor.fetchone()

            if existing_user:
                return jsonify({'message': 'Username already exists'}), 409  # HTTP 409 Conflict

            # If the username is new, insert a new record with the default bio
            cursor.execute("INSERT INTO users (username, password, bio) VALUES (%s, %s, %s)",
                           (username, password, bio))
            connection.commit()

            cursor.close()
            connection.close()

            return jsonify({'message': 'Sign-up successful'}), 201  # HTTP 201 Created

        except mysql.connector.Error as error:
            print('Error executing SQL query:', error)
            return jsonify({'message': 'Error executing SQL query'}), 500






@app.route('/poetry_trending', methods=['POST'])
def poetry_trending():
    data = request.get_json()
    user_id = data.get('userId')

    connection = connect_to_database()
    if connection is None:
        return jsonify({'message': 'Error connecting to the database'}), 500

    try:
        cursor = connection.cursor()

        # Updated SQL query
        cursor.execute("""
            SELECT 
                pp.poetry_id, pp.username, pp.title, pp.poem_text, 
                pp.like_count, pp.comment_count, pp.user_id, pp.poet_name,
                lp.poetry_id IS NOT NULL AS isLiked,
                f.following_id IS NOT NULL AS isFollowing,
                pc.id AS collection_id,
                CASE WHEN pc.id IS NOT NULL THEN 1 ELSE 0 END AS isCollected,
                COALESCE(img.image_url, 'false') AS image_url
            FROM poem_post pp
            LEFT JOIN liked_poems lp ON pp.poetry_id = lp.poetry_id AND lp.user_id = %s
            LEFT JOIN followings f ON pp.user_id = f.following_id AND f.user_id = %s
            LEFT JOIN poem_collection pc ON pp.poetry_id = pc.poetry_id AND pc.user_id = %s
            LEFT JOIN image img ON pp.user_id = img.user_id  -- Join with image table
            ORDER BY pp.like_count DESC
        """, (user_id, user_id, user_id))

        results = cursor.fetchall()

        cursor.close()
        connection.close()

        output = []
        for row in results:
            data = {
                'poetry_id': row[0],
                'username': row[1],
                'title': row[2],
                'poem_text': row[3],
                'like_count': row[4],
                'comment_count': row[5],
                'user_id': row[6],
                'poet_name': row[7],
                'isLiked': row[8],
                'isFollowing': row[9],
                'collection_id': row[10],
                'isCollected': row[11],
                'image_url': row[12]  # Include image_url
            }
            output.append(data)

        return jsonify(output)

    except mysql.connector.Error as error:
        print(f'Error executing SQL query: {error}')
        return jsonify({'message': 'Error executing SQL query'}), 500






@app.route('/poetry_following', methods=['POST'])
def poetry_following():
    data = request.get_json()
    user_id = data.get('userId')

    connection = connect_to_database()
    if connection is None:
        return jsonify({'message': 'Error connecting to the database'}), 500

    try:
        cursor = connection.cursor()

        # Updated SQL query
        cursor.execute("""
            SELECT 
                pp.poetry_id, pp.username, pp.title, pp.poem_text, 
                pp.like_count, pp.comment_count, pp.user_id, pp.poet_name,
                lp.poetry_id IS NOT NULL AS isLiked,
                f.following_id IS NOT NULL AS isFollowing,
                pc.id AS collection_id,
                CASE WHEN pc.id IS NOT NULL THEN 1 ELSE 0 END AS isCollected,
                COALESCE(img.image_url, 'false') AS image_url
            FROM poem_post pp
            LEFT JOIN liked_poems lp ON pp.poetry_id = lp.poetry_id AND lp.user_id = %s
            LEFT JOIN followings f ON pp.user_id = f.following_id AND f.user_id = %s
            LEFT JOIN poem_collection pc ON pp.poetry_id = pc.poetry_id AND pc.user_id = %s
            LEFT JOIN image img ON pp.user_id = img.user_id  -- Join with image table
            WHERE pp.user_id IN (SELECT following_id FROM followings WHERE user_id = %s)
            ORDER BY pp.like_count DESC
        """, (user_id, user_id, user_id, user_id))

        results = cursor.fetchall()

        cursor.close()
        connection.close()

        output = []
        for row in results:
            data = {
                'poetry_id': row[0],
                'username': row[1],
                'title': row[2],
                'poem_text': row[3],
                'like_count': row[4],
                'comment_count': row[5],
                'user_id': row[6],
                'poet_name': row[7],
                'isLiked': row[8],
                'isFollowing': row[9],
                'collection_id': row[10],
                'isCollected': row[11],
                'image_url': row[12]  # Include image_url
            }
            output.append(data)

        return jsonify(output)

    except mysql.connector.Error as error:
        print(f'Error executing SQL query: {error}')
        return jsonify({'message': 'Error executing SQL query'}), 500






@app.route('/save_collection', methods=['POST'])
def save_collection():
    data = request.get_json()
    user_id = data.get('userId')
    collection_id = data.get('collectionId')

    connection = connect_to_database()
    if connection is None:
        return jsonify({'message': 'Error connecting to the database'}), 500

    try:
        cursor = connection.cursor()

        # Check if a record for the user and collection already exists
        cursor.execute("SELECT * FROM saved_collections WHERE user_id = %s AND collection_id = %s",
                       (user_id, collection_id))
        existing_save = cursor.fetchone()

        if existing_save:
            # If the record already exists, return a message indicating it's already saved
            return jsonify({'message': 'Collection already saved by this user'}), 400
        else:
            # If the record doesn't exist, insert it (save)
            cursor.execute("INSERT INTO saved_collections (user_id, collection_id) VALUES (%s, %s)",
                           (user_id, collection_id))
            connection.commit()

        cursor.close()
        connection.close()

        return jsonify({'message': 'Collection saved successfully'}), 200

    except mysql.connector.Error as error:
        print(f'Error executing SQL query: {error}')
        return jsonify({'message': 'Error executing SQL query'}), 500





@app.route('/save_collection_cancel', methods=['POST'])
def save_collection_cancel():
    data = request.get_json()
    user_id = data.get('userId')
    collection_id = data.get('collectionId')

    connection = connect_to_database()
    if connection is None:
        return jsonify({'message': 'Error connecting to the database'}), 500

    try:
        cursor = connection.cursor()

        # Check if a record for the user and collection already exists
        cursor.execute("SELECT * FROM saved_collections WHERE user_id = %s AND collection_id = %s",
                       (user_id, collection_id))
        existing_save = cursor.fetchone()

        if existing_save is not None:
            # If the record exists, delete it
            cursor.execute("DELETE FROM saved_collections WHERE user_id = %s AND collection_id = %s",
                           (user_id, collection_id))
            connection.commit()

        cursor.close()
        connection.close()

        return jsonify({'message': 'Collection save canceled'}), 200

    except mysql.connector.Error as error:
        print(f'Error executing SQL query: {error}')
        return jsonify({'message': 'Error executing SQL query'}), 500





@app.route('/check_save_collection', methods=['POST'])
def check_save_collection():
    data = request.get_json()
    user_id = data.get('userId')
    collection_id = data.get('collectionId')

    connection = connect_to_database()
    if connection is None:
        return jsonify({'message': 'Error connecting to the database'}), 500

    try:
        cursor = connection.cursor()

        # Check if a record for the user and collection already exists
        cursor.execute("SELECT * FROM saved_collections WHERE user_id = %s AND collection_id = %s",
                       (user_id, collection_id))
        existing_save = cursor.fetchone()

        is_saved = existing_save is not None

        cursor.close()
        connection.close()

        return jsonify({'isSaved': is_saved}), 200

    except mysql.connector.Error as error:
        print(f'Error executing SQL query: {error}')
        return jsonify({'message': 'Error executing SQL query'}), 500





@app.route('/display_saved_collection_lists', methods=['POST'])
def display_saved_collection_lists():
    data = request.get_json()
    user_id = data.get('user_id')

    if user_id is None:
        return jsonify({'message': 'Invalid input data'}), 400

    connection = connect_to_database()
    if connection is None:
        return jsonify({'message': 'Error connecting to the database'}), 500

    try:
        cursor = connection.cursor()

        cursor.execute("SELECT collection_id FROM saved_collections WHERE user_id = %s", (user_id,))
        collection_ids = [row[0] for row in cursor.fetchall()]

        if not collection_ids:
            return jsonify({'message': 'No saved collections for the user'})

        placeholders = ', '.join(['%s'] * len(collection_ids))

        cursor.execute(f"""
            SELECT cl.id, cl.list_name, cl.intro, cl.user_id, u.username, icl.image_url
            FROM collection_lists cl
            JOIN users u ON cl.user_id = u.id
            LEFT JOIN image_collection_list icl ON cl.id = icl.list_id
            WHERE cl.id IN ({placeholders})
        """, collection_ids)

        results = cursor.fetchall()
        cursor.close()
        connection.close()

        output = []
        for row in results:
            data = {
                'id': row[0],
                'list_name': row[1],
                'intro': row[2],
                'user_id': row[3],
                'username': row[4],
                'image_url': row[5] if row[5] is not None else False,
                'isSaved': True  # As this function deals with saved collections, isSaved is always True
            }
            output.append(data)

        return jsonify(output)

    except mysql.connector.Error as error:
        print('Error executing SQL query:', error)
        return jsonify({'message': 'Error executing SQL query'}), 500








@app.route('/delete_collection_list', methods=['POST'])
def delete_collection_list():
    data = request.get_json()
    user_id = data.get('userId')
    collection_id = data.get('collectionId')

    # Connect to the database
    connection = connect_to_database()
    if connection is None:
        return jsonify({'message': 'Error connecting to the database'}), 500

    try:
        cursor = connection.cursor()

        # Check and delete records from saved_collections
        cursor.execute("DELETE FROM saved_collections WHERE collection_id = %s", (collection_id,))
        connection.commit()

        # Check and delete records from poem_collection
        cursor.execute("DELETE FROM poem_collection WHERE list_id = %s", (collection_id,))
        connection.commit()

        # Delete the corresponding image record in image_collection_list
        cursor.execute("DELETE FROM image_collection_list WHERE list_id = %s", (collection_id,))
        connection.commit()

        # Delete the collection list
        cursor.execute("DELETE FROM collection_lists WHERE id = %s AND user_id = %s", (collection_id, user_id))
        connection.commit()

        cursor.close()
        connection.close()

        return jsonify({'message': 'Collection list deleted successfully'}), 200

    except mysql.connector.Error as error:
        print(f'Error executing SQL query: {error}')
        return jsonify({'message': 'Error executing SQL query'}), 500






@app.route('/latest_poem_feed', methods=['POST'])
def get_latest_poem_feed():
    data = request.get_json()
    user_id = data.get('userId')

    connection = connect_to_database()
    if connection is None:
        return jsonify({'message': 'Error connecting to the database'}), 500

    try:
        cursor = connection.cursor()

        # Updated SQL query
        cursor.execute("""
            SELECT 
                pp.poetry_id, pp.username, pp.title, pp.poem_text, 
                pp.like_count, pp.comment_count, pp.user_id, pp.poet_name,
                lp.poetry_id IS NOT NULL AS isLiked,
                f.following_id IS NOT NULL AS isFollowing,
                pc.id AS collection_id,
                CASE WHEN pc.id IS NOT NULL THEN 1 ELSE 0 END AS isCollected,
                COALESCE(img.image_url, 'false') AS image_url
            FROM poem_post pp
            LEFT JOIN liked_poems lp ON pp.poetry_id = lp.poetry_id AND lp.user_id = %s
            LEFT JOIN followings f ON pp.user_id = f.following_id AND f.user_id = %s
            LEFT JOIN poem_collection pc ON pp.poetry_id = pc.poetry_id AND pc.user_id = %s
            LEFT JOIN image img ON pp.user_id = img.user_id  -- Join with image table
            ORDER BY pp.poetry_id DESC
        """, (user_id, user_id, user_id))

        results = cursor.fetchall()

        cursor.close()
        connection.close()

        output = []
        for row in results:
            data = {
                'poetry_id': row[0],
                'username': row[1],
                'title': row[2],
                'poem_text': row[3],
                'like_count': row[4],
                'comment_count': row[5],
                'user_id': row[6],
                'poet_name': row[7],
                'isLiked': row[8],
                'isFollowing': row[9],
                'collection_id': row[10],
                'isCollected': row[11],
                'image_url': row[12]  # Include image_url
            }
            output.append(data)

        return jsonify(output)

    except mysql.connector.Error as error:
        print(f'Error executing SQL query: {error}')
        return jsonify({'message': 'Error executing SQL query'}), 500



@app.route('/upload_image', methods=['POST'])
def upload_image():
    connection = connect_to_database()
    if connection is None:
        return jsonify({'message': 'Error connecting to the database'}), 500

    try:
        data = request.get_json()
        user_id = data.get('userId')
        username = data.get('username')
        base64_image = data.get('image')

        if not user_id or not username:
            return jsonify({'message': 'Missing user ID or username'}), 400

        # Decode the base64 image data
        image_data = base64.b64decode(base64_image)

        # Ensure the 'images' directory exists
        images_directory = 'images'  # Relative directory path
        if not os.path.exists(images_directory):
            os.makedirs(images_directory)

        # Construct the image filename
        image_filename = f"{user_id}_{username}_avatar.jpg"

        # Save the image data as a file
        image_path = os.path.join(images_directory, image_filename)
        with open(image_path, 'wb') as img_file:
            img_file.write(image_data)

        # Construct the relative image path (instead of a URL)
        relative_image_path = os.path.join('images', image_filename)

        # Check if the image already exists in the database for the user
        cursor = connection.cursor()
        cursor.execute("""
            SELECT * FROM image WHERE user_id = %s AND image_url = %s
        """, (user_id, relative_image_path))
        existing_record = cursor.fetchone()

        # If the record does not exist, insert the new record
        if not existing_record:
            cursor.execute("""
                INSERT INTO image (user_id, image_url) VALUES (%s, %s)
            """, (user_id, relative_image_path))
            connection.commit()
            message = 'Image uploaded and saved'
        else:
            message = 'Image already exists'

        cursor.close()
        connection.close()

        return jsonify({'message': message, 'imagePath': relative_image_path}), 200

    except mysql.connector.Error as error:
        print(f'Error executing SQL query: {error}')
        return jsonify({'message': 'Error executing SQL query'}), 500
    except Exception as e:
        if connection:
            connection.close()
        print(str(e))
        return jsonify({'message': str(e)}), 400



@app.route('/get_profile_photos', methods=['POST'])
def get_profile_photos():
    # Get the data from the request
    data = request.get_json()
    user_id = data.get('userId')

    # Validate user_id
    if not user_id:
        return jsonify({'message': 'Missing user ID'}), 400

    connection = connect_to_database()
    if connection is None:
        return jsonify({'message': 'Error connecting to the database'}), 500

    try:
        cursor = connection.cursor()

        # Query the database for the image URL associated with the user_id
        cursor.execute("""
            SELECT image_url 
            FROM image 
            WHERE user_id = %s
        """, (user_id,))

        # Fetch the first result
        result = cursor.fetchone()
        cursor.close()
        connection.close()

        # Check if an image was found
        if result:
            # Return the image URL
            return jsonify({'image_url': result[0]}), 200
        else:
            # No image found for the user
            return jsonify({'message': 'No image found for the user'}), 404

    except mysql.connector.Error as error:
        print(f'Error executing SQL query: {error}')
        return jsonify({'message': 'Error executing SQL query'}), 500
    except Exception as e:
        if connection:
            connection.close()
        return jsonify({'message': 'An error occurred'}), 400




@app.route('/get_poet_intro', methods=['POST'])
def get_poet_intro():
    data = request.get_json()
    poet_name = data.get('poetName')  # Make sure 'poetName' is the key used in the front end.

    if not poet_name:
        return jsonify({'message': 'No poet name provided'}), 400

    connection = connect_to_database()
    if connection is None:
        return jsonify({'message': 'Error connecting to the database'}), 500

    try:
        cursor = connection.cursor()

        # SQL query to select all columns from poet_profile where poet_name matches the provided poet_name
        cursor.execute("""
            SELECT id, poet_name, poet_bio, contributors 
            FROM poet_profile 
            WHERE poet_name = %s
        """, (poet_name,))

        result = cursor.fetchone()  # Using fetchone() since we expect only one or no result.

        cursor.close()
        connection.close()

        if result:
            # Map the result to a dictionary for JSON response
            poet_data = {
                'id': result[0],
                'poet_name': result[1],
                'poet_bio': result[2],
                'contributors': result[3]
            }
            return jsonify(poet_data), 200
        else:
            return jsonify({'message': 'Poet not found'}), 404

    except mysql_error as error:
        print(f'Error executing SQL query: {error}')
        return jsonify({'message': 'Error executing SQL query'}), 500
    except Exception as e:
        if connection:
            connection.close()
        print(str(e))
        return jsonify({'message': str(e)}), 400



@app.route('/edit_poet_intro', methods=['POST'])
def edit_poet_intro():
    data = request.get_json()
    poet_name = data.get('poetName')  # Make sure 'poetName' is the key used in the front end.
    poet_bio = data.get('poetBio')
    username = data.get('username')

    if not poet_name or poet_bio is None or not username:
        return jsonify({'message': 'Missing data (poet name, bio, or username)'}), 400

    connection = connect_to_database()
    if connection is None:
        return jsonify({'message': 'Error connecting to the database'}), 500

    try:
        cursor = connection.cursor()

        # Check if the poet already exists in the database
        cursor.execute("""
            SELECT contributors FROM poet_profile WHERE poet_name = %s
        """, (poet_name,))
        result = cursor.fetchone()

        if result:
            # Update the existing poet's bio and contributors
            current_contributors = result[0]
            contributors_list = current_contributors.split(',') if current_contributors else []
            # Check if username is already a contributor
            if username not in contributors_list:
                new_contributors = f"{current_contributors},{username}" if current_contributors else username
            else:
                new_contributors = current_contributors

            cursor.execute("""
                UPDATE poet_profile
                SET poet_bio = %s, contributors = %s
                WHERE poet_name = %s
            """, (poet_bio, new_contributors, poet_name))
        else:
            # Insert a new poet record
            cursor.execute("""
                INSERT INTO poet_profile (poet_name, poet_bio, contributors) 
                VALUES (%s, %s, %s)
            """, (poet_name, poet_bio, username))

        # Commit the changes to the database
        connection.commit()

        cursor.close()
        connection.close()

        return jsonify({'message': 'Poet introduction updated successfully'}), 200

    except mysql.connector.Error as error:
        print(f'Error: {error}')
        return jsonify({'message': 'Error executing SQL query'}), 500
    except Exception as e:
        if connection:
            connection.close()
        print(str(e))
        return jsonify({'message': str(e)}), 400



@app.route('/image_poet_external_url', methods=['POST'])
def image_poet_external_url():
    data = request.get_json()
    poet_name = data.get('poet_name')
    image_url = data.get('image_url')

    if not poet_name or not image_url:
        return jsonify({'message': 'Poet name and image URL are required'}), 400

    connection = connect_to_database()
    if connection is None:
        return jsonify({'message': 'Error connecting to the database'}), 500

    try:
        cursor = connection.cursor()

        # Check if a record with the poet_name already exists
        cursor.execute("SELECT id FROM image_poet WHERE poet_name = %s", (poet_name,))
        existing_record = cursor.fetchone()

        if existing_record:
            # If it exists, update the image_url
            cursor.execute("UPDATE image_poet SET image_url = %s WHERE poet_name = %s", (image_url, poet_name))
        else:
            # If it doesn't exist, insert a new record
            cursor.execute("INSERT INTO image_poet (poet_name, image_url) VALUES (%s, %s)", (poet_name, image_url))

        # Commit the changes
        connection.commit()

        # Close the cursor and connection
        cursor.close()
        connection.close()

        # Return a success response
        action = 'updated' if existing_record else 'inserted'
        return jsonify({'message': f'Image URL for {poet_name} has been {action} successfully.'})

    except mysql.connector.Error as error:
        print(f'Error executing SQL query: {error}')
        connection.rollback()  # Rollback the changes on error
        return jsonify({'message': 'Error executing SQL query'}), 500

    finally:
        # Ensure the connection is closed even if an error occurs
        if connection.is_connected():
            cursor.close()
            connection.close()




@app.route('/get_image_poet_external_url', methods=['POST'])
def get_image_poet_external_url():
    data = request.get_json()
    poet_name = data.get('poet_name')

    if not poet_name:
        return jsonify({'message': 'Poet name is required'}), 400

    connection = connect_to_database()
    if connection is None:
        return jsonify({'message': 'Error connecting to the database'}), 500

    try:
        cursor = connection.cursor()

        # Find the record with the given poet_name
        cursor.execute("SELECT image_url FROM image_poet WHERE poet_name = %s", (poet_name,))
        result = cursor.fetchone()

        cursor.close()
        connection.close()

        if result:
            # If a record is found, return the image_url
            image_url = result[0]
            return jsonify({'poet_name': poet_name, 'image_url': image_url})

        else:
            # If no record is found, return a message indicating this
            return jsonify({'message': f'No image URL found for poet named {poet_name}'})

    except mysql.connector.Error as error:
        print(f'Error executing SQL query: {error}')
        return jsonify({'message': 'Error executing SQL query'}), 500

    finally:
        # Ensure the connection is closed even if an error occurs
        if connection.is_connected():
            cursor.close()
            connection.close()



@app.route('/image_user_external_url', methods=['POST'])
def image_user_external_url():
    data = request.get_json()
    user_id = data.get('user_id')
    image_url = data.get('image_url')

    if not user_id or not image_url:
        return jsonify({'message': 'User ID and image URL are required'}), 400

    connection = connect_to_database()
    if connection is None:
        return jsonify({'message': 'Error connecting to the database'}), 500

    try:
        cursor = connection.cursor()

        # Check if a record with the user_id already exists
        cursor.execute("SELECT id FROM image WHERE user_id = %s", (user_id,))
        existing_record = cursor.fetchone()

        if existing_record:
            # If it exists, update the image_url
            cursor.execute("UPDATE image SET image_url = %s WHERE user_id = %s", (image_url, user_id))
        else:
            # If it doesn't exist, insert a new record
            cursor.execute("INSERT INTO image (user_id, image_url) VALUES (%s, %s)", (user_id, image_url))

        # Commit the changes
        connection.commit()

        # Close the cursor and connection
        cursor.close()
        connection.close()

        # Return a success response
        action = 'updated' if existing_record else 'inserted'
        return jsonify({'message': f'Image URL for user ID {user_id} has been {action} successfully.'})

    except mysql.connector.Error as error:
        print(f'Error executing SQL query: {error}')
        connection.rollback()  # Rollback the changes on error
        return jsonify({'message': 'Error executing SQL query'}), 500

    finally:
        # Ensure the connection is closed even if an error occurs
        if connection.is_connected():
            cursor.close()
            connection.close()



@app.route('/get_image_user_external_url', methods=['POST'])
def get_image_user_external_url():
    data = request.get_json()
    user_id = data.get('user_id')

    if not user_id:
        return jsonify({'message': 'User ID is required'}), 400

    connection = connect_to_database()
    if connection is None:
        return jsonify({'message': 'Error connecting to the database'}), 500

    try:
        cursor = connection.cursor()

        # Find the record with the given user_id
        cursor.execute("SELECT image_url FROM image WHERE user_id = %s", (user_id,))
        result = cursor.fetchone()

        cursor.close()
        connection.close()

        if result:
            # If a record is found, return the image_url
            image_url = result[0]
            return jsonify({'user_id': user_id, 'image_url': image_url})

        else:
            # If no record is found, return a message indicating this
            return jsonify({'message': f'No image URL found for user ID {user_id}'})

    except mysql.connector.Error as error:
        print(f'Error executing SQL query: {error}')
        return jsonify({'message': 'Error executing SQL query'}), 500

    finally:
        # Ensure the connection is closed even if an error occurs
        if connection.is_connected():
            cursor.close()
            connection.close()



@app.route('/display_poetry_by_another_user', methods=['POST'])
def display_poetry_by_another_user():
    data = request.get_json()
    user_id_one = data.get('user_id_one')
    user_id_two = data.get('user_id_two')

    if user_id_one is None or user_id_two is None:
        return jsonify({'message': 'Invalid input data'}), 400

    connection = connect_to_database()
    if connection is None:
        return jsonify({'message': 'Error connecting to the database'}), 500

    try:
        cursor = connection.cursor()

        # Get all poems posted by user_id_two
        cursor.execute("SELECT * FROM poem_post WHERE user_id = %s", (user_id_two,))
        poems = cursor.fetchall()

        output = []
        for poem in poems:
            poetry_id = poem[0]

            # Check if the poem is liked by user_id_one
            cursor.execute("SELECT COUNT(*) FROM liked_poems WHERE user_id = %s AND poetry_id = %s", (user_id_one, poetry_id))
            isLiked = cursor.fetchone()[0] > 0

            # Check if user_id_one is following user_id_two
            cursor.execute("SELECT COUNT(*) FROM followings WHERE user_id = %s AND following_id = %s", (user_id_one, user_id_two))
            isFollowing = cursor.fetchone()[0] > 0

            # Check if the poem is collected by user_id_one
            cursor.execute("SELECT id FROM poem_collection WHERE user_id = %s AND poetry_id = %s", (user_id_one, poetry_id))
            collection_result = cursor.fetchone()
            collection_id = collection_result[0] if collection_result else None
            isCollected = collection_id is not None

            # Get the image URL of user_id_two
            cursor.execute("SELECT image_url FROM image WHERE user_id = %s", (user_id_two,))
            image_result = cursor.fetchone()
            image_url = image_result[0] if image_result else 'false'

            # Append the poem data along with the additional checks to the output list
            poem_data = {
                'poetry_id': poetry_id,
                'username': poem[1],
                'title': poem[2],
                'poem_text': poem[3],
                'like_count': poem[4],
                'comment_count': poem[5],
                'user_id': poem[6],
                'poet_name': poem[7],
                'isLiked': isLiked,
                'isFollowing': isFollowing,
                'collection_id': collection_id,
                'isCollected': isCollected,
                'image_url': image_url
            }
            output.append(poem_data)

        cursor.close()
        connection.close()

        return jsonify(output)

    except mysql.connector.Error as error:
        print(f'Error executing SQL query: {error}')
        return jsonify({'message': 'Error executing SQL query'}), 500



@app.route('/user_profile_another', methods=['POST'])
def user_profile_another():
    data = request.get_json()
    user_id = data.get('user_id')
    user_id_login = data.get('user_id_login')

    if user_id is None or user_id_login is None:
        return jsonify({'message': 'Invalid input data'}), 400

    connection = connect_to_database()
    if connection is None:
        return jsonify({'message': 'Error connecting to the database'}), 500

    try:
        cursor = connection.cursor()

        # Fetch user data
        cursor.execute("SELECT username, bio FROM users WHERE id = %s", (user_id,))
        user_data = cursor.fetchone()

        if user_data:
            username, bio = user_data
        else:
            return jsonify({'message': 'User not found'}), 404

        # Followers count
        cursor.execute("SELECT COUNT(*) FROM followers WHERE user_id = %s", (user_id,))
        followers_count = cursor.fetchone()[0]

        # Followings count
        cursor.execute("SELECT COUNT(*) FROM followings WHERE user_id = %s", (user_id,))
        followings_count = cursor.fetchone()[0]

        # Poetry count
        cursor.execute("SELECT COUNT(*) FROM poem_post WHERE user_id = %s", (user_id,))
        poetry_count = cursor.fetchone()[0]

        # Image URL
        cursor.execute("SELECT image_url FROM image WHERE user_id = %s", (user_id,))
        image_result = cursor.fetchone()
        image_url = image_result[0] if image_result else 'false'

        # Check if user_id_login is following user_id
        cursor.execute("SELECT COUNT(*) FROM followings WHERE user_id = %s AND following_id = %s", (user_id_login, user_id))
        isFollowing = cursor.fetchone()[0] > 0

        cursor.close()
        connection.close()

        return jsonify({
            'username': username,
            'bio': bio,
            'followers_count': followers_count,
            'followings_count': followings_count,
            'poetry_count': poetry_count,
            'image_url': image_url,
            'isFollowing': isFollowing
        }), 200

    except mysql.connector.Error as error:
        print('Error executing SQL query:', error)
        return jsonify({'message': 'Error executing SQL query'}), 500



@app.route('/random_poet_suggestion', methods=['GET'])
def random_poet_suggestion():
    connection = connect_to_database()
    if connection is None:
        return jsonify({'message': 'Error connecting to the database'}), 500

    try:
        cursor = connection.cursor()

        # Query a random record from poet_profile
        cursor.execute("""
            SELECT id, poet_name, poet_bio
            FROM poet_profile
            ORDER BY RAND()
            LIMIT 1
        """)
        poet_profile = cursor.fetchone()

        if poet_profile is None:
            return jsonify({'message': 'No poets found'}), 404

        poet_name = poet_profile[1]

        # Find corresponding image_url
        cursor.execute("""
            SELECT image_url
            FROM image_poet
            WHERE poet_name = %s
        """, (poet_name,))
        image_poet = cursor.fetchone()

        image_url = image_poet[0] if image_poet else 'No image found'

        # Select a random poem
        cursor.execute("""
            SELECT title, poem_text
            FROM poem_post
            WHERE poet_name = %s
            ORDER BY RAND()
            LIMIT 1
        """, (poet_name,))
        poem_post = cursor.fetchone()

        title, poem_text = poem_post if poem_post else ('No poem title', 'No poem text')

        cursor.close()
        connection.close()

        return jsonify({
            'poet_name': poet_name,
            'poet_bio': poet_profile[2],
            'image_url': image_url,
            'title': title,
            'poem_text': poem_text
        })

    except mysql.connector.Error as error:
        print(f'Error executing SQL query: {error}')
        return jsonify({'message': 'Error executing SQL query'}), 500



@app.route('/collection_cover_url', methods=['POST'])
def collection_cover_url():
    data = request.get_json()
    list_id = data.get('list_id')
    image_url = data.get('image_url')

    if not list_id or not image_url:
        return jsonify({'message': 'List ID and image URL are required'}), 400

    connection = connect_to_database()
    if connection is None:
        return jsonify({'message': 'Error connecting to the database'}), 500

    try:
        cursor = connection.cursor()

        # Check if a record with the list_id already exists
        cursor.execute("SELECT id FROM image_collection_list WHERE list_id = %s", (list_id,))
        existing_record = cursor.fetchone()

        if existing_record:
            # If it exists, update the image_url
            cursor.execute("UPDATE image_collection_list SET image_url = %s WHERE list_id = %s", (image_url, list_id))
        else:
            # If it doesn't exist, insert a new record
            cursor.execute("INSERT INTO image_collection_list (list_id, image_url) VALUES (%s, %s)", (list_id, image_url))

        # Commit the changes
        connection.commit()

        # Close the cursor and connection
        cursor.close()
        connection.close()

        # Return a success response
        action = 'updated' if existing_record else 'inserted'
        return jsonify({'message': f'Image URL for list ID {list_id} has been {action} successfully.'})

    except mysql.connector.Error as error:
        print(f'Error executing SQL query: {error}')
        connection.rollback()  # Rollback the changes on error
        return jsonify({'message': 'Error executing SQL query'}), 500

    finally:
        # Ensure the connection is closed even if an error occurs
        if connection.is_connected():
            cursor.close()
            connection.close()


@app.route('/collection_lists_other_user', methods=['POST'])
def collection_lists_other_user():
    data = request.get_json()
    user_id_login = data.get('user_id_login')
    user_id = data.get('user_id')

    if not user_id_login or not user_id:
        return jsonify({'message': 'Invalid input data'}), 400

    connection = connect_to_database()
    if connection is None:
        return jsonify({'message': 'Error connecting to the database'}), 500

    try:
        cursor = connection.cursor()
        # Query to get collection lists
        cursor.execute("""
            SELECT cl.id, cl.list_name, cl.intro, cl.user_id
            FROM collection_lists cl
            WHERE cl.user_id = %s
        """, (user_id,))

        collections = cursor.fetchall()

        output = []
        for collection in collections:
            collection_id, list_name, intro, user_id = collection

            # Get username from users table
            cursor.execute("SELECT username FROM users WHERE id = %s", (user_id,))
            username = cursor.fetchone()[0]

            # Get image_url from image_collection_list
            cursor.execute("SELECT image_url FROM image_collection_list WHERE list_id = %s", (collection_id,))
            image_result = cursor.fetchone()
            image_url = image_result[0] if image_result else False

            # Check if the collection is saved by user_id_login
            cursor.execute("""
                SELECT COUNT(*) FROM saved_collections 
                WHERE user_id = %s AND collection_id = %s
            """, (user_id_login, collection_id))
            isSaved = cursor.fetchone()[0] > 0

            output.append({
                'id': collection_id,
                'list_name': list_name,
                'intro': intro,
                'user_id': user_id,
                'username': username,
                'image_url': image_url,
                'isSaved': isSaved
            })

        cursor.close()
        connection.close()

        return jsonify(output)

    except mysql.connector.Error as error:
        print('Error executing SQL query:', error)
        return jsonify({'message': 'Error executing SQL query'}), 500




@app.route('/display_saved_collection_lists_other_user', methods=['POST'])
def display_saved_collection_lists_other_user():
    data = request.get_json()
    user_id_login = data.get('user_id_login')
    user_id = data.get('user_id')

    if user_id_login is None or user_id is None:
        return jsonify({'message': 'Invalid input data'}), 400

    connection = connect_to_database()
    if connection is None:
        return jsonify({'message': 'Error connecting to the database'}), 500

    try:
        cursor = connection.cursor()

        # Fetch collection IDs from saved_collections for the specified user_id
        cursor.execute("SELECT collection_id FROM saved_collections WHERE user_id = %s", (user_id,))
        collection_ids = [row[0] for row in cursor.fetchall()]

        if not collection_ids:
            return jsonify({'message': 'No saved collections for the user'})

        placeholders = ', '.join(['%s'] * len(collection_ids))

        cursor.execute(f"""
            SELECT cl.id, cl.list_name, cl.intro, cl.user_id, u.username, icl.image_url,
                   CASE WHEN sc.id IS NOT NULL THEN TRUE ELSE FALSE END AS isSaved
            FROM collection_lists cl
            JOIN users u ON cl.user_id = u.id
            LEFT JOIN image_collection_list icl ON cl.id = icl.list_id
            LEFT JOIN saved_collections sc ON cl.id = sc.collection_id AND sc.user_id = %s
            WHERE cl.id IN ({placeholders})
        """, (user_id_login, *collection_ids))

        results = cursor.fetchall()
        cursor.close()
        connection.close()

        output = []
        for row in results:
            data = {
                'id': row[0],
                'list_name': row[1],
                'intro': row[2],
                'user_id': row[3],
                'username': row[4],
                'image_url': row[5] if row[5] is not None else False,
                'isSaved': row[6]
            }
            output.append(data)

        return jsonify(output)

    except mysql.connector.Error as error:
        print('Error executing SQL query:', error)
        return jsonify({'message': 'Error executing SQL query'}), 500


    
if __name__ == '__main__':
    app.run()
