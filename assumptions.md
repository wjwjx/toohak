<h2>Team BOOST Assumptions</h2>       

<h3>1. Alphanumeric Assumption </h3>

<p>All variables passed into a function, regardless of</br>
function type, will be within the alphanumeric range of characters, with</br>
the exception of special characters for emails and passwords.</p>


<h3>2. Empty Quiz Name </h3>

<p>Althought spaces are allowed in quiz names, a quiz must have at</br>
least one alphanumeric character in it's name, i.e. a quiz name with</br>
8 spaces would not be valid.</p> 

<h3>3. Independent Login Details Assumption</h3>

<p>We are currently assuming that the authUserId being passed into each</br> 
function is the userId of that that is currently logged in. In all cases, we</br>
are currently assuming that this confirmation is being bypassed and is already</br> 
true, in order for the correct authUserId to be updating/accessing information </br>
only available to them. E.g. We assume that the authUserId passed in to a name </br>
update function is the authUserId of the person that is logged in, not just someone </br>
who has another persons userId.</p>

<h3>4. User Logout Assumption</h3>

<p>When a user remains idle for more than 20 minutes, the user is logged out.</br>
This is an assumption because certain functions require a condition of whether</br>
multiple users are logged in at the same time.</p>

<h3>5. Different Users Quiz Creation Assumptions</h3>

<p>Different users can create the quizzes with the same name, since their authUserId</br>
is different. 

<h3>6. User Email Unique Case Sensitive Assumption</h3>

User Email Uniqueness Assumption of Case Sensitive: While the spec mentions returning</br> 
an error if an email is already used by another user, it doesn't explicitly state whether</br> 
the email addresses are case sensitive. We will assume they are, meaning that "name@test.com"</br> 
and "Name@test.com" are not considered same.</p>
