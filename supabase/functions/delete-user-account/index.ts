import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Get user from auth header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create client with user's token to get their ID
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Get the user's ID from their JWT
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    })

    const { data: { user }, error: userError } = await userClient.auth.getUser()
    if (userError || !user) {
      console.error('Error getting user:', userError)
      return new Response(
        JSON.stringify({ error: 'Invalid user token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const userId = user.id
    const userEmail = user.email
    console.log('Deleting account for user:', userId)

    // Create admin client with service role key
    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    // Get user profile for name and language
    const { data: profile } = await adminClient
      .from('profiles')
      .select('display_name, first_name, language')
      .eq('id', userId)
      .single()

    const userName = profile?.display_name || profile?.first_name || 'User'
    const userLanguage = (profile?.language as 'de' | 'en') || 'de'

    // Delete in correct order to respect foreign key constraints:
    
    // 1. Get user's events to delete related ticket_categories
    const { data: userEvents } = await adminClient
      .from('events')
      .select('id')
      .eq('user_id', userId)

    const eventIds = userEvents?.map(e => e.id) || []
    console.log('Found user events:', eventIds.length)

    // 2. Get participant IDs for user's tickets
    const { data: userParticipants } = await adminClient
      .from('participants')
      .select('id')
      .eq('user_id', userId)

    const participantIds = userParticipants?.map(p => p.id) || []
    console.log('Found user participants:', participantIds.length)

    // 3. Delete tickets linked to user's participants
    if (participantIds.length > 0) {
      const { error: ticketsError } = await adminClient
        .from('tickets')
        .delete()
        .in('participant_id', participantIds)
      
      if (ticketsError) console.error('Error deleting tickets:', ticketsError)
    }

    // 4. Delete tickets for user's events (as organizer)
    if (eventIds.length > 0) {
      const { error: eventTicketsError } = await adminClient
        .from('tickets')
        .delete()
        .in('event_id', eventIds)
      
      if (eventTicketsError) console.error('Error deleting event tickets:', eventTicketsError)
    }

    // 5. Delete ticket_categories for user's events
    if (eventIds.length > 0) {
      const { error: categoriesError } = await adminClient
        .from('ticket_categories')
        .delete()
        .in('event_id', eventIds)
      
      if (categoriesError) console.error('Error deleting ticket categories:', categoriesError)
    }

    // 6. Delete user's participants
    const { error: participantsError } = await adminClient
      .from('participants')
      .delete()
      .eq('user_id', userId)
    
    if (participantsError) console.error('Error deleting participants:', participantsError)

    // 7. Delete participants in user's events (other people who joined)
    if (eventIds.length > 0) {
      const { error: eventParticipantsError } = await adminClient
        .from('participants')
        .delete()
        .in('event_id', eventIds)
      
      if (eventParticipantsError) console.error('Error deleting event participants:', eventParticipantsError)
    }

    // 8. Delete user's events
    const { error: eventsError } = await adminClient
      .from('events')
      .delete()
      .eq('user_id', userId)
    
    if (eventsError) console.error('Error deleting events:', eventsError)

    // 9. Delete user's profile
    const { error: profileError } = await adminClient
      .from('profiles')
      .delete()
      .eq('id', userId)
    
    if (profileError) console.error('Error deleting profile:', profileError)

    // 10. Finally, delete the auth user
    const { error: authDeleteError } = await adminClient.auth.admin.deleteUser(userId)
    
    if (authDeleteError) {
      console.error('Error deleting auth user:', authDeleteError)
      return new Response(
        JSON.stringify({ error: 'Failed to delete user account', details: authDeleteError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Successfully deleted user:', userId)

    // 11. Send confirmation email (fire and forget - don't block on this)
    if (userEmail) {
      try {
        const notificationUrl = `${supabaseUrl}/functions/v1/send-notification`
        await fetch(notificationUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseAnonKey}`,
          },
          body: JSON.stringify({
            type: 'account_deleted',
            recipientEmail: userEmail,
            recipientName: userName,
            language: userLanguage,
          }),
        })
        console.log('Account deletion confirmation email sent to:', userEmail)
      } catch (emailError) {
        // Don't fail the deletion if email fails
        console.error('Failed to send account deletion email:', emailError)
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Account deleted successfully' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: unknown) {
    console.error('Unexpected error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
