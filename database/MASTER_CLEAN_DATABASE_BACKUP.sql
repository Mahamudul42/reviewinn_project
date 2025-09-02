--
-- PostgreSQL database dump
--

\restrict pybVh3GoZHs2sbPdO3YMNDDuIM6f05yT1XvIfiYzbRorYEZOtFVaTly1UhnNCjD

-- Dumped from database version 17.6 (Debian 17.6-1.pgdg13+1)
-- Dumped by pg_dump version 17.6 (Ubuntu 17.6-1.pgdg22.04+1)

-- Started on 2025-09-02 21:28:03 UTC

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

DROP DATABASE reviewinn_database;
--
-- TOC entry 4278 (class 1262 OID 16384)
-- Name: reviewinn_database; Type: DATABASE; Schema: -; Owner: reviewinn_user
--

CREATE DATABASE reviewinn_database WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'en_US.utf8';


ALTER DATABASE reviewinn_database OWNER TO reviewinn_user;

\unrestrict pybVh3GoZHs2sbPdO3YMNDDuIM6f05yT1XvIfiYzbRorYEZOtFVaTly1UhnNCjD
\connect reviewinn_database
\restrict pybVh3GoZHs2sbPdO3YMNDDuIM6f05yT1XvIfiYzbRorYEZOtFVaTly1UhnNCjD

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 966 (class 1247 OID 16394)
-- Name: comment_reaction_type; Type: TYPE; Schema: public; Owner: reviewinn_user
--

CREATE TYPE public.comment_reaction_type AS ENUM (
    'thumbs_up',
    'thumbs_down',
    'bomb',
    'love',
    'haha',
    'celebration',
    'sad',
    'eyes'
);


ALTER TYPE public.comment_reaction_type OWNER TO reviewinn_user;

--
-- TOC entry 975 (class 1247 OID 16436)
-- Name: connection_status_enum; Type: TYPE; Schema: public; Owner: reviewinn_user
--

CREATE TYPE public.connection_status_enum AS ENUM (
    'PENDING',
    'ACCEPTED',
    'BLOCKED',
    'REJECTED'
);


ALTER TYPE public.connection_status_enum OWNER TO reviewinn_user;

--
-- TOC entry 972 (class 1247 OID 16430)
-- Name: connection_type_enum; Type: TYPE; Schema: public; Owner: reviewinn_user
--

CREATE TYPE public.connection_type_enum AS ENUM (
    'FOLLOW',
    'FRIEND'
);


ALTER TYPE public.connection_type_enum OWNER TO reviewinn_user;

--
-- TOC entry 969 (class 1247 OID 16412)
-- Name: reaction_type; Type: TYPE; Schema: public; Owner: reviewinn_user
--

CREATE TYPE public.reaction_type AS ENUM (
    'thumbs_up',
    'thumbs_down',
    'bomb',
    'love',
    'haha',
    'celebration',
    'sad',
    'eyes'
);


ALTER TYPE public.reaction_type OWNER TO reviewinn_user;

--
-- TOC entry 963 (class 1247 OID 16386)
-- Name: userrole; Type: TYPE; Schema: public; Owner: reviewinn_user
--

CREATE TYPE public.userrole AS ENUM (
    'USER',
    'MODERATOR',
    'ADMIN'
);


ALTER TYPE public.userrole OWNER TO reviewinn_user;

--
-- TOC entry 337 (class 1255 OID 17531)
-- Name: get_count_consistency_report(); Type: FUNCTION; Schema: public; Owner: reviewinn_user
--

CREATE FUNCTION public.get_count_consistency_report() RETURNS TABLE(review_id integer, stored_comment_count integer, actual_comment_count bigint, comment_count_diff integer, stored_view_count integer, actual_view_count bigint, view_count_diff integer, stored_reaction_count integer, actual_reaction_count bigint, reaction_count_diff integer)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        rm.review_id,
        rm.comment_count as stored_comment_count,
        COALESCE(cc.actual_comments, 0) as actual_comment_count,
        rm.comment_count - COALESCE(cc.actual_comments, 0)::INTEGER as comment_count_diff,
        rm.view_count as stored_view_count,
        COALESCE(vc.actual_views, 0) as actual_view_count,
        rm.view_count - COALESCE(vc.actual_views, 0)::INTEGER as view_count_diff,
        rm.reaction_count as stored_reaction_count,
        COALESCE(rc.actual_reactions, 0) as actual_reaction_count,
        rm.reaction_count - COALESCE(rc.actual_reactions, 0)::INTEGER as reaction_count_diff
    FROM review_main rm
    LEFT JOIN (
        SELECT review_id, COUNT(*) as actual_comments
        FROM review_comments
        GROUP BY review_id
    ) cc ON rm.review_id = cc.review_id
    LEFT JOIN (
        SELECT review_id, COUNT(*) as actual_views
        FROM review_views
        WHERE (is_valid IS NULL OR is_valid = true)
        AND (expires_at IS NULL OR expires_at > NOW())
        GROUP BY review_id
    ) vc ON rm.review_id = vc.review_id
    LEFT JOIN (
        SELECT review_id, COUNT(*) as actual_reactions
        FROM review_reactions
        GROUP BY review_id
    ) rc ON rm.review_id = rc.review_id
    WHERE rm.comment_count != COALESCE(cc.actual_comments, 0)
       OR rm.view_count != COALESCE(vc.actual_views, 0)
       OR rm.reaction_count != COALESCE(rc.actual_reactions, 0)
    ORDER BY rm.review_id;
END;
$$;


ALTER FUNCTION public.get_count_consistency_report() OWNER TO reviewinn_user;

--
-- TOC entry 342 (class 1255 OID 17543)
-- Name: get_reaction_summary_enterprise(integer, integer); Type: FUNCTION; Schema: public; Owner: reviewinn_user
--

CREATE FUNCTION public.get_reaction_summary_enterprise(p_review_id integer, p_user_id integer DEFAULT NULL::integer) RETURNS TABLE(reaction_type character varying, reaction_count bigint, user_reaction character varying, total_reactions bigint)
    LANGUAGE sql STABLE
    AS $$
    WITH reaction_counts AS (
        SELECT 
            rr.reaction_type::VARCHAR(50) as reaction_type,
            COUNT(*) as reaction_count
        FROM review_reactions rr
        WHERE rr.review_id = p_review_id
        GROUP BY rr.reaction_type
    ),
    user_reaction_query AS (
        SELECT rr.reaction_type::VARCHAR(50) as user_reaction_type
        FROM review_reactions rr
        WHERE rr.review_id = p_review_id 
          AND rr.user_id = p_user_id
        LIMIT 1
    ),
    total_count AS (
        SELECT COUNT(*) as total
        FROM review_reactions rr
        WHERE rr.review_id = p_review_id
    )
    SELECT 
        rc.reaction_type,
        rc.reaction_count,
        COALESCE(ur.user_reaction_type, NULL::VARCHAR(50)) as user_reaction,
        tc.total as total_reactions
    FROM reaction_counts rc
    CROSS JOIN total_count tc
    LEFT JOIN user_reaction_query ur ON TRUE
    
    UNION ALL
    
    -- Handle case where user has reaction but it's not in the main counts
    SELECT 
        NULL::VARCHAR(50),
        0::BIGINT,
        ur.user_reaction_type,
        tc.total
    FROM user_reaction_query ur
    CROSS JOIN total_count tc
    WHERE NOT EXISTS (SELECT 1 FROM reaction_counts);
$$;


ALTER FUNCTION public.get_reaction_summary_enterprise(p_review_id integer, p_user_id integer) OWNER TO reviewinn_user;

--
-- TOC entry 338 (class 1255 OID 17540)
-- Name: get_user_reaction_optimized(integer, integer); Type: FUNCTION; Schema: public; Owner: reviewinn_user
--

CREATE FUNCTION public.get_user_reaction_optimized(p_user_id integer, p_review_id integer) RETURNS character varying
    LANGUAGE sql STABLE
    AS $$
    SELECT reaction_type::text
    FROM review_reactions
    WHERE user_id = p_user_id AND review_id = p_review_id;
$$;


ALTER FUNCTION public.get_user_reaction_optimized(p_user_id integer, p_review_id integer) OWNER TO reviewinn_user;

--
-- TOC entry 340 (class 1255 OID 17544)
-- Name: get_user_reactions_bulk(integer, integer, integer); Type: FUNCTION; Schema: public; Owner: reviewinn_user
--

CREATE FUNCTION public.get_user_reactions_bulk(p_user_id integer, p_limit integer DEFAULT 50, p_offset integer DEFAULT 0) RETURNS TABLE(review_id integer, reaction_type character varying, reaction_id integer, created_at timestamp with time zone, updated_at timestamp with time zone)
    LANGUAGE sql STABLE
    AS $$
    SELECT 
        rr.review_id,
        rr.reaction_type::VARCHAR(50),
        rr.reaction_id,
        rr.created_at,
        rr.updated_at
    FROM review_reactions rr
    WHERE rr.user_id = p_user_id
    ORDER BY rr.created_at DESC
    LIMIT p_limit OFFSET p_offset;
$$;


ALTER FUNCTION public.get_user_reactions_bulk(p_user_id integer, p_limit integer, p_offset integer) OWNER TO reviewinn_user;

--
-- TOC entry 336 (class 1255 OID 17530)
-- Name: recalculate_all_counts(); Type: FUNCTION; Schema: public; Owner: reviewinn_user
--

CREATE FUNCTION public.recalculate_all_counts() RETURNS TABLE(reviews_updated integer, comments_updated integer, reactions_updated integer, views_updated integer)
    LANGUAGE plpgsql
    AS $$
DECLARE
    review_count INTEGER;
    comment_count INTEGER;
    reaction_count INTEGER;
    view_count INTEGER;
    review_record RECORD;
BEGIN
    -- Fix comment counts
    UPDATE review_main SET comment_count = (
        SELECT COUNT(*) 
        FROM review_comments 
        WHERE review_comments.review_id = review_main.review_id
    );
    GET DIAGNOSTICS review_count = ROW_COUNT;
    
    -- Fix comment reaction counts
    UPDATE review_comments SET reaction_count = COALESCE((
        SELECT COUNT(*) 
        FROM review_comment_reactions 
        WHERE review_comment_reactions.comment_id = review_comments.comment_id
    ), 0);
    GET DIAGNOSTICS comment_count = ROW_COUNT;
    
    -- Fix review reaction counts
    FOR review_record IN SELECT review_id FROM review_main
    LOOP
        PERFORM update_single_review_reaction_count(review_record.review_id);
    END LOOP;
    GET DIAGNOSTICS reaction_count = ROW_COUNT;
    
    -- Fix view counts
    UPDATE review_main SET view_count = COALESCE((
        SELECT COUNT(*) 
        FROM review_views 
        WHERE review_views.review_id = review_main.review_id
        AND (is_valid IS NULL OR is_valid = true)
        AND (expires_at IS NULL OR expires_at > NOW())
    ), 0);
    GET DIAGNOSTICS view_count = ROW_COUNT;
    
    RETURN QUERY SELECT review_count, comment_count, reaction_count, view_count;
END;
$$;


ALTER FUNCTION public.recalculate_all_counts() OWNER TO reviewinn_user;

--
-- TOC entry 339 (class 1255 OID 17542)
-- Name: remove_user_reaction_optimized(integer, integer); Type: FUNCTION; Schema: public; Owner: reviewinn_user
--

CREATE FUNCTION public.remove_user_reaction_optimized(p_user_id integer, p_review_id integer) RETURNS TABLE(deleted boolean, reaction_id integer, reaction_type character varying)
    LANGUAGE plpgsql
    AS $$
DECLARE
    deleted_reaction RECORD;
BEGIN
    DELETE FROM review_reactions 
    WHERE user_id = p_user_id AND review_id = p_review_id
    RETURNING review_reactions.reaction_id, review_reactions.reaction_type::VARCHAR(50) INTO deleted_reaction;
    
    IF FOUND THEN
        RETURN QUERY SELECT TRUE, deleted_reaction.reaction_id, deleted_reaction.reaction_type;
    ELSE
        RETURN QUERY SELECT FALSE, NULL::INTEGER, NULL::VARCHAR(50);
    END IF;
END;
$$;


ALTER FUNCTION public.remove_user_reaction_optimized(p_user_id integer, p_review_id integer) OWNER TO reviewinn_user;

--
-- TOC entry 343 (class 1255 OID 17550)
-- Name: review_reactions_performance_stats(); Type: FUNCTION; Schema: public; Owner: reviewinn_user
--

CREATE FUNCTION public.review_reactions_performance_stats() RETURNS TABLE(total_reactions bigint, unique_users bigint, unique_reviews bigint, avg_reactions_per_review numeric, avg_reactions_per_user numeric, top_reaction_type character varying, top_reaction_count bigint, index_usage_stats json)
    LANGUAGE sql STABLE
    AS $$
    WITH base_stats AS (
        SELECT 
            COUNT(*) as total_reactions,
            COUNT(DISTINCT user_id) as unique_users,
            COUNT(DISTINCT review_id) as unique_reviews
        FROM review_reactions
    ),
    reaction_type_stats AS (
        SELECT 
            reaction_type::VARCHAR(50) as top_reaction_type,
            COUNT(*) as top_reaction_count
        FROM review_reactions
        GROUP BY reaction_type
        ORDER BY COUNT(*) DESC
        LIMIT 1
    ),
    index_stats AS (
        SELECT json_agg(
            json_build_object(
                'index_name', indexname,
                'size', pg_size_pretty(pg_total_relation_size(indexname::regclass))
            )
        ) as index_usage_stats
        FROM pg_indexes 
        WHERE tablename = 'review_reactions'
    )
    SELECT 
        bs.total_reactions,
        bs.unique_users,
        bs.unique_reviews,
        ROUND(bs.total_reactions::DECIMAL / bs.unique_reviews, 2) as avg_reactions_per_review,
        ROUND(bs.total_reactions::DECIMAL / bs.unique_users, 2) as avg_reactions_per_user,
        rts.top_reaction_type,
        rts.top_reaction_count,
        is_table.index_usage_stats
    FROM base_stats bs
    CROSS JOIN reaction_type_stats rts  
    CROSS JOIN index_stats is_table;
$$;


ALTER FUNCTION public.review_reactions_performance_stats() OWNER TO reviewinn_user;

--
-- TOC entry 344 (class 1255 OID 17554)
-- Name: sync_supertokens_user(character varying, character varying, character varying, character varying, character varying); Type: FUNCTION; Schema: public; Owner: reviewinn_user
--

CREATE FUNCTION public.sync_supertokens_user(p_supertokens_user_id character varying, p_email character varying, p_first_name character varying DEFAULT NULL::character varying, p_last_name character varying DEFAULT NULL::character varying, p_display_name character varying DEFAULT NULL::character varying) RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_user_id INTEGER;
    v_username VARCHAR(255);
    v_computed_display_name VARCHAR(255);
BEGIN
    -- Generate username from email
    v_username := LOWER(SPLIT_PART(p_email, '@', 1));
    
    -- Generate display name
    IF p_display_name IS NOT NULL THEN
        v_computed_display_name := p_display_name;
    ELSIF p_first_name IS NOT NULL AND p_last_name IS NOT NULL THEN
        v_computed_display_name := TRIM(p_first_name || ' ' || p_last_name);
    ELSE
        v_computed_display_name := v_username;
    END IF;
    
    -- Check if user already exists with this SuperTokens ID
    SELECT user_id INTO v_user_id 
    FROM core_users 
    WHERE supertokens_user_id = p_supertokens_user_id;
    
    IF FOUND THEN
        -- Update existing user
        UPDATE core_users SET
            email = p_email,
            first_name = COALESCE(p_first_name, first_name),
            last_name = COALESCE(p_last_name, last_name),
            display_name = COALESCE(v_computed_display_name, display_name),
            updated_at = NOW()
        WHERE user_id = v_user_id;
        
        RAISE NOTICE 'Updated existing user % with SuperTokens ID %', v_user_id, p_supertokens_user_id;
        RETURN v_user_id;
    END IF;
    
    -- Check if user exists with this email but no SuperTokens ID
    SELECT user_id INTO v_user_id 
    FROM core_users 
    WHERE email = p_email AND supertokens_user_id IS NULL;
    
    IF FOUND THEN
        -- Link existing user to SuperTokens
        UPDATE core_users SET
            supertokens_user_id = p_supertokens_user_id,
            first_name = COALESCE(p_first_name, first_name),
            last_name = COALESCE(p_last_name, last_name),
            display_name = COALESCE(v_computed_display_name, display_name),
            is_verified = true, -- SuperTokens handles verification
            updated_at = NOW()
        WHERE user_id = v_user_id;
        
        RAISE NOTICE 'Linked existing user % to SuperTokens ID %', v_user_id, p_supertokens_user_id;
        RETURN v_user_id;
    END IF;
    
    -- Make username unique if it already exists
    WHILE EXISTS(SELECT 1 FROM core_users WHERE username = v_username) LOOP
        v_username := v_username || '_' || floor(random() * 1000)::text;
    END LOOP;
    
    -- Create new user
    INSERT INTO core_users (
        supertokens_user_id,
        username,
        email,
        hashed_password, -- Will be managed by SuperTokens
        first_name,
        last_name,
        display_name,
        is_verified, -- SuperTokens handles verification
        is_active,
        created_at,
        updated_at
    ) VALUES (
        p_supertokens_user_id,
        v_username,
        p_email,
        '', -- Empty since SuperTokens manages passwords
        p_first_name,
        p_last_name,
        v_computed_display_name,
        true, -- SuperTokens users are verified
        true,
        NOW(),
        NOW()
    ) RETURNING user_id INTO v_user_id;
    
    RAISE NOTICE 'Created new user % for SuperTokens ID %', v_user_id, p_supertokens_user_id;
    RETURN v_user_id;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error syncing SuperTokens user: %', SQLERRM;
END;
$$;


ALTER FUNCTION public.sync_supertokens_user(p_supertokens_user_id character varying, p_email character varying, p_first_name character varying, p_last_name character varying, p_display_name character varying) OWNER TO reviewinn_user;

--
-- TOC entry 4279 (class 0 OID 0)
-- Dependencies: 344
-- Name: FUNCTION sync_supertokens_user(p_supertokens_user_id character varying, p_email character varying, p_first_name character varying, p_last_name character varying, p_display_name character varying); Type: COMMENT; Schema: public; Owner: reviewinn_user
--

COMMENT ON FUNCTION public.sync_supertokens_user(p_supertokens_user_id character varying, p_email character varying, p_first_name character varying, p_last_name character varying, p_display_name character varying) IS 'Syncs SuperTokens user data with ReviewInn user records';


--
-- TOC entry 335 (class 1255 OID 17519)
-- Name: update_comment_reaction_count(); Type: FUNCTION; Schema: public; Owner: reviewinn_user
--

CREATE FUNCTION public.update_comment_reaction_count() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Handle INSERT
    IF TG_OP = 'INSERT' THEN
        UPDATE review_comments 
        SET reaction_count = (
            SELECT COUNT(*) 
            FROM review_comment_reactions 
            WHERE comment_id = NEW.comment_id
        )
        WHERE comment_id = NEW.comment_id;
        
        RETURN NEW;
    END IF;
    
    -- Handle DELETE
    IF TG_OP = 'DELETE' THEN
        UPDATE review_comments 
        SET reaction_count = (
            SELECT COUNT(*) 
            FROM review_comment_reactions 
            WHERE comment_id = OLD.comment_id
        )
        WHERE comment_id = OLD.comment_id;
        
        RETURN OLD;
    END IF;
    
    -- Handle UPDATE (if comment_id changes)
    IF TG_OP = 'UPDATE' AND OLD.comment_id != NEW.comment_id THEN
        -- Update old comment count
        UPDATE review_comments 
        SET reaction_count = (
            SELECT COUNT(*) 
            FROM review_comment_reactions 
            WHERE comment_id = OLD.comment_id
        )
        WHERE comment_id = OLD.comment_id;
        
        -- Update new comment count
        UPDATE review_comments 
        SET reaction_count = (
            SELECT COUNT(*) 
            FROM review_comment_reactions 
            WHERE comment_id = NEW.comment_id
        )
        WHERE comment_id = NEW.comment_id;
        
        RETURN NEW;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION public.update_comment_reaction_count() OWNER TO reviewinn_user;

--
-- TOC entry 345 (class 1255 OID 17555)
-- Name: update_core_users_updated_at(); Type: FUNCTION; Schema: public; Owner: reviewinn_user
--

CREATE FUNCTION public.update_core_users_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_core_users_updated_at() OWNER TO reviewinn_user;

--
-- TOC entry 334 (class 1255 OID 17518)
-- Name: update_review_comment_count(); Type: FUNCTION; Schema: public; Owner: reviewinn_user
--

CREATE FUNCTION public.update_review_comment_count() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Handle INSERT
    IF TG_OP = 'INSERT' THEN
        UPDATE review_main 
        SET comment_count = (
            SELECT COUNT(*) 
            FROM review_comments 
            WHERE review_id = NEW.review_id
        )
        WHERE review_id = NEW.review_id;
        
        RETURN NEW;
    END IF;
    
    -- Handle DELETE
    IF TG_OP = 'DELETE' THEN
        UPDATE review_main 
        SET comment_count = (
            SELECT COUNT(*) 
            FROM review_comments 
            WHERE review_id = OLD.review_id
        )
        WHERE review_id = OLD.review_id;
        
        RETURN OLD;
    END IF;
    
    -- Handle UPDATE (if review_id changes)
    IF TG_OP = 'UPDATE' AND OLD.review_id != NEW.review_id THEN
        -- Update old review count
        UPDATE review_main 
        SET comment_count = (
            SELECT COUNT(*) 
            FROM review_comments 
            WHERE review_id = OLD.review_id
        )
        WHERE review_id = OLD.review_id;
        
        -- Update new review count
        UPDATE review_main 
        SET comment_count = (
            SELECT COUNT(*) 
            FROM review_comments 
            WHERE review_id = NEW.review_id
        )
        WHERE review_id = NEW.review_id;
        
        RETURN NEW;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION public.update_review_comment_count() OWNER TO reviewinn_user;

--
-- TOC entry 332 (class 1255 OID 17520)
-- Name: update_review_reaction_count(); Type: FUNCTION; Schema: public; Owner: reviewinn_user
--

CREATE FUNCTION public.update_review_reaction_count() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    target_review_id INTEGER;
    reaction_stats RECORD;
    total_reactions INTEGER := 0;
    top_reactions_json JSON := '{}';
BEGIN
    -- Determine which review_id to update
    IF TG_OP = 'DELETE' THEN
        target_review_id := OLD.review_id;
    ELSE
        target_review_id := NEW.review_id;
    END IF;
    
    -- Handle case where review_id changes (UPDATE)
    IF TG_OP = 'UPDATE' AND OLD.review_id != NEW.review_id THEN
        -- Update old review
        PERFORM update_single_review_reaction_count(OLD.review_id);
        -- Continue with new review below
    END IF;
    
    -- Update the target review
    PERFORM update_single_review_reaction_count(target_review_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION public.update_review_reaction_count() OWNER TO reviewinn_user;

--
-- TOC entry 333 (class 1255 OID 17522)
-- Name: update_review_view_count(); Type: FUNCTION; Schema: public; Owner: reviewinn_user
--

CREATE FUNCTION public.update_review_view_count() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    target_review_id INTEGER;
    valid_view_count INTEGER;
BEGIN
    -- Determine which review_id to update
    IF TG_OP = 'DELETE' THEN
        target_review_id := OLD.review_id;
    ELSE
        target_review_id := NEW.review_id;
    END IF;
    
    -- Handle case where review_id changes (UPDATE)
    IF TG_OP = 'UPDATE' AND OLD.review_id != NEW.review_id THEN
        -- Update old review count
        SELECT COUNT(*) INTO valid_view_count
        FROM review_views 
        WHERE review_id = OLD.review_id 
        AND (is_valid IS NULL OR is_valid = true)
        AND (expires_at IS NULL OR expires_at > NOW());
        
        UPDATE review_main 
        SET view_count = valid_view_count
        WHERE review_id = OLD.review_id;
    END IF;
    
    -- Count valid views for the target review
    SELECT COUNT(*) INTO valid_view_count
    FROM review_views 
    WHERE review_id = target_review_id 
    AND (is_valid IS NULL OR is_valid = true)
    AND (expires_at IS NULL OR expires_at > NOW());
    
    -- Update the review with the accurate count
    UPDATE review_main 
    SET view_count = valid_view_count
    WHERE review_id = target_review_id;
    
    RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION public.update_review_view_count() OWNER TO reviewinn_user;

--
-- TOC entry 319 (class 1255 OID 17532)
-- Name: update_single_review_reaction_count(integer); Type: FUNCTION; Schema: public; Owner: reviewinn_user
--

CREATE FUNCTION public.update_single_review_reaction_count(target_review_id integer) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
    reaction_stats RECORD;
    total_reactions INTEGER := 0;
    reactions_obj JSONB := '{}';
BEGIN
    -- Get reaction counts grouped by type
    FOR reaction_stats IN
        SELECT reaction_type, COUNT(*) as count
        FROM review_reactions 
        WHERE review_id = target_review_id
        GROUP BY reaction_type
        ORDER BY COUNT(*) DESC
        LIMIT 10
    LOOP
        -- Build the reactions object using JSONB
        reactions_obj := reactions_obj || jsonb_build_object(reaction_stats.reaction_type::text, reaction_stats.count);
        total_reactions := total_reactions + reaction_stats.count;
    END LOOP;
    
    -- Update the review with new counts (cast JSONB to JSON)
    UPDATE review_main 
    SET 
        reaction_count = total_reactions,
        top_reactions = reactions_obj::json,
        updated_at = NOW()
    WHERE review_id = target_review_id;
    
END;
$$;


ALTER FUNCTION public.update_single_review_reaction_count(target_review_id integer) OWNER TO reviewinn_user;

--
-- TOC entry 320 (class 1255 OID 18264)
-- Name: update_user_interactions_updated_at(); Type: FUNCTION; Schema: public; Owner: reviewinn_user
--

CREATE FUNCTION public.update_user_interactions_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_user_interactions_updated_at() OWNER TO reviewinn_user;

--
-- TOC entry 341 (class 1255 OID 17541)
-- Name: upsert_user_reaction_optimized(integer, integer, character varying); Type: FUNCTION; Schema: public; Owner: reviewinn_user
--

CREATE FUNCTION public.upsert_user_reaction_optimized(p_user_id integer, p_review_id integer, p_reaction_type character varying) RETURNS TABLE(action character varying, reaction_id integer, user_id integer, review_id integer, reaction_type character varying, created_at timestamp with time zone, updated_at timestamp with time zone)
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Use PostgreSQL's native UPSERT (ON CONFLICT) for maximum performance
    INSERT INTO review_reactions (user_id, review_id, reaction_type)
    VALUES (p_user_id, p_review_id, p_reaction_type::reaction_type)
    ON CONFLICT (user_id, review_id) 
    DO UPDATE SET 
        reaction_type = EXCLUDED.reaction_type,
        updated_at = NOW()
    RETURNING 
        CASE 
            WHEN xmax = 0 THEN 'INSERT'::VARCHAR(10)
            ELSE 'UPDATE'::VARCHAR(10)
        END as action,
        review_reactions.reaction_id,
        review_reactions.user_id,
        review_reactions.review_id,
        review_reactions.reaction_type::VARCHAR(50),
        review_reactions.created_at,
        review_reactions.updated_at
    INTO action, reaction_id, user_id, review_id, reaction_type, created_at, updated_at;
    
    RETURN NEXT;
END;
$$;


ALTER FUNCTION public.upsert_user_reaction_optimized(p_user_id integer, p_review_id integer, p_reaction_type character varying) OWNER TO reviewinn_user;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 256 (class 1259 OID 16823)
-- Name: badge_awards; Type: TABLE; Schema: public; Owner: reviewinn_user
--

CREATE TABLE public.badge_awards (
    award_id bigint NOT NULL,
    user_id bigint,
    badge_definition_id bigint,
    awarded_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.badge_awards OWNER TO reviewinn_user;

--
-- TOC entry 255 (class 1259 OID 16822)
-- Name: badge_awards_award_id_seq; Type: SEQUENCE; Schema: public; Owner: reviewinn_user
--

CREATE SEQUENCE public.badge_awards_award_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.badge_awards_award_id_seq OWNER TO reviewinn_user;

--
-- TOC entry 4280 (class 0 OID 0)
-- Dependencies: 255
-- Name: badge_awards_award_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: reviewinn_user
--

ALTER SEQUENCE public.badge_awards_award_id_seq OWNED BY public.badge_awards.award_id;


--
-- TOC entry 226 (class 1259 OID 16502)
-- Name: badge_definitions; Type: TABLE; Schema: public; Owner: reviewinn_user
--

CREATE TABLE public.badge_definitions (
    badge_definition_id bigint NOT NULL,
    name character varying(50) NOT NULL,
    description text,
    criteria json NOT NULL,
    image_url character varying(255),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.badge_definitions OWNER TO reviewinn_user;

--
-- TOC entry 225 (class 1259 OID 16501)
-- Name: badge_definitions_badge_definition_id_seq; Type: SEQUENCE; Schema: public; Owner: reviewinn_user
--

CREATE SEQUENCE public.badge_definitions_badge_definition_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.badge_definitions_badge_definition_id_seq OWNER TO reviewinn_user;

--
-- TOC entry 4281 (class 0 OID 0)
-- Dependencies: 225
-- Name: badge_definitions_badge_definition_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: reviewinn_user
--

ALTER SEQUENCE public.badge_definitions_badge_definition_id_seq OWNED BY public.badge_definitions.badge_definition_id;


--
-- TOC entry 220 (class 1259 OID 16461)
-- Name: badges; Type: TABLE; Schema: public; Owner: reviewinn_user
--

CREATE TABLE public.badges (
    badge_id integer NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    icon character varying(50)
);


ALTER TABLE public.badges OWNER TO reviewinn_user;

--
-- TOC entry 219 (class 1259 OID 16460)
-- Name: badges_badge_id_seq; Type: SEQUENCE; Schema: public; Owner: reviewinn_user
--

CREATE SEQUENCE public.badges_badge_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.badges_badge_id_seq OWNER TO reviewinn_user;

--
-- TOC entry 4282 (class 0 OID 0)
-- Dependencies: 219
-- Name: badges_badge_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: reviewinn_user
--

ALTER SEQUENCE public.badges_badge_id_seq OWNED BY public.badges.badge_id;


--
-- TOC entry 274 (class 1259 OID 17006)
-- Name: category_questions; Type: TABLE; Schema: public; Owner: reviewinn_user
--

CREATE TABLE public.category_questions (
    id bigint NOT NULL,
    category_path character varying(255) NOT NULL,
    category_name character varying(200) NOT NULL,
    category_level integer NOT NULL,
    is_root_category boolean NOT NULL,
    questions json NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by bigint,
    is_active boolean,
    usage_count integer,
    last_used_at timestamp with time zone
);


ALTER TABLE public.category_questions OWNER TO reviewinn_user;

--
-- TOC entry 273 (class 1259 OID 17005)
-- Name: category_questions_id_seq; Type: SEQUENCE; Schema: public; Owner: reviewinn_user
--

CREATE SEQUENCE public.category_questions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.category_questions_id_seq OWNER TO reviewinn_user;

--
-- TOC entry 4283 (class 0 OID 0)
-- Dependencies: 273
-- Name: category_questions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: reviewinn_user
--

ALTER SEQUENCE public.category_questions_id_seq OWNED BY public.category_questions.id;


--
-- TOC entry 234 (class 1259 OID 16574)
-- Name: core_entities; Type: TABLE; Schema: public; Owner: reviewinn_user
--

CREATE TABLE public.core_entities (
    entity_id integer NOT NULL,
    name character varying(200) NOT NULL,
    description text,
    avatar character varying(255),
    website character varying(500),
    images jsonb,
    root_category jsonb,
    final_category jsonb,
    is_verified boolean,
    is_active boolean,
    is_claimed boolean,
    claimed_by integer,
    claimed_at timestamp with time zone,
    metadata jsonb,
    roles jsonb,
    related_entities jsonb,
    business_info jsonb,
    claim_data jsonb,
    view_analytics jsonb,
    average_rating double precision,
    review_count integer,
    view_count integer NOT NULL,
    reaction_count integer NOT NULL,
    comment_count integer NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone
);


ALTER TABLE public.core_entities OWNER TO reviewinn_user;

--
-- TOC entry 233 (class 1259 OID 16573)
-- Name: core_entities_entity_id_seq; Type: SEQUENCE; Schema: public; Owner: reviewinn_user
--

CREATE SEQUENCE public.core_entities_entity_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.core_entities_entity_id_seq OWNER TO reviewinn_user;

--
-- TOC entry 4284 (class 0 OID 0)
-- Dependencies: 233
-- Name: core_entities_entity_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: reviewinn_user
--

ALTER SEQUENCE public.core_entities_entity_id_seq OWNED BY public.core_entities.entity_id;


--
-- TOC entry 236 (class 1259 OID 16591)
-- Name: core_notifications; Type: TABLE; Schema: public; Owner: reviewinn_user
--

CREATE TABLE public.core_notifications (
    notification_id integer NOT NULL,
    user_id integer,
    actor_id integer,
    type character varying(50) NOT NULL,
    title character varying(200),
    content text,
    is_read boolean NOT NULL,
    priority character varying(20) NOT NULL,
    delivery_status character varying(20) NOT NULL,
    entity_type character varying(50),
    entity_id integer,
    notification_data jsonb NOT NULL,
    expires_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.core_notifications OWNER TO reviewinn_user;

--
-- TOC entry 235 (class 1259 OID 16590)
-- Name: core_notifications_notification_id_seq; Type: SEQUENCE; Schema: public; Owner: reviewinn_user
--

CREATE SEQUENCE public.core_notifications_notification_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.core_notifications_notification_id_seq OWNER TO reviewinn_user;

--
-- TOC entry 4285 (class 0 OID 0)
-- Dependencies: 235
-- Name: core_notifications_notification_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: reviewinn_user
--

ALTER SEQUENCE public.core_notifications_notification_id_seq OWNED BY public.core_notifications.notification_id;


--
-- TOC entry 218 (class 1259 OID 16446)
-- Name: core_users; Type: TABLE; Schema: public; Owner: reviewinn_user
--

CREATE TABLE public.core_users (
    user_id integer NOT NULL,
    username character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    hashed_password character varying NOT NULL,
    first_name character varying(255),
    last_name character varying(255),
    display_name character varying(255),
    avatar character varying(255),
    bio text,
    country character varying(100),
    city character varying(100),
    is_verified boolean,
    is_active boolean,
    is_premium boolean,
    follower_count integer,
    following_count integer,
    review_count integer,
    friend_count integer,
    level integer,
    points integer,
    last_gamification_sync timestamp with time zone,
    gamification_sync_version integer,
    gamification_sync_status character varying(50),
    last_active_at timestamp with time zone,
    last_login_at timestamp with time zone,
    role public.userrole,
    permissions json,
    failed_login_attempts integer,
    account_locked_until timestamp with time zone,
    password_changed_at timestamp with time zone,
    email_verification_token character varying(255),
    email_verification_expires timestamp with time zone,
    email_verified_at timestamp with time zone,
    password_reset_token character varying(255),
    password_reset_expires timestamp with time zone,
    active_sessions json,
    trusted_devices json,
    security_events json,
    two_factor_enabled boolean,
    two_factor_secret character varying(255),
    recovery_codes json,
    profile_data json,
    preferences json,
    verification_data json,
    favorite_entities json,
    favorite_reviews json,
    favorite_comments json,
    favorite_users json,
    favorite_categories json,
    view_tracking json,
    saved_reviews json,
    followed_entities json,
    notification_preferences json,
    review_interests json,
    blocked_users json,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone
);


ALTER TABLE public.core_users OWNER TO reviewinn_user;

--
-- TOC entry 217 (class 1259 OID 16445)
-- Name: core_users_user_id_seq; Type: SEQUENCE; Schema: public; Owner: reviewinn_user
--

CREATE SEQUENCE public.core_users_user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.core_users_user_id_seq OWNER TO reviewinn_user;

--
-- TOC entry 4286 (class 0 OID 0)
-- Dependencies: 217
-- Name: core_users_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: reviewinn_user
--

ALTER SEQUENCE public.core_users_user_id_seq OWNED BY public.core_users.user_id;


--
-- TOC entry 260 (class 1259 OID 16858)
-- Name: daily_tasks; Type: TABLE; Schema: public; Owner: reviewinn_user
--

CREATE TABLE public.daily_tasks (
    task_id bigint NOT NULL,
    user_id bigint,
    label character varying(100) NOT NULL,
    complete boolean NOT NULL,
    task_date date NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.daily_tasks OWNER TO reviewinn_user;

--
-- TOC entry 259 (class 1259 OID 16857)
-- Name: daily_tasks_task_id_seq; Type: SEQUENCE; Schema: public; Owner: reviewinn_user
--

CREATE SEQUENCE public.daily_tasks_task_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.daily_tasks_task_id_seq OWNER TO reviewinn_user;

--
-- TOC entry 4287 (class 0 OID 0)
-- Dependencies: 259
-- Name: daily_tasks_task_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: reviewinn_user
--

ALTER SEQUENCE public.daily_tasks_task_id_seq OWNED BY public.daily_tasks.task_id;


--
-- TOC entry 300 (class 1259 OID 17289)
-- Name: entity_analytics; Type: TABLE; Schema: public; Owner: reviewinn_user
--

CREATE TABLE public.entity_analytics (
    entity_id bigint NOT NULL,
    total_views integer,
    unique_visitors integer,
    average_time_on_page integer,
    bounce_rate numeric(5,2),
    last_updated timestamp with time zone DEFAULT now()
);


ALTER TABLE public.entity_analytics OWNER TO reviewinn_user;

--
-- TOC entry 266 (class 1259 OID 16910)
-- Name: entity_comparisons; Type: TABLE; Schema: public; Owner: reviewinn_user
--

CREATE TABLE public.entity_comparisons (
    comparison_id bigint NOT NULL,
    user_id bigint,
    entity_ids json NOT NULL,
    comparison_data json NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.entity_comparisons OWNER TO reviewinn_user;

--
-- TOC entry 265 (class 1259 OID 16909)
-- Name: entity_comparisons_comparison_id_seq; Type: SEQUENCE; Schema: public; Owner: reviewinn_user
--

CREATE SEQUENCE public.entity_comparisons_comparison_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.entity_comparisons_comparison_id_seq OWNER TO reviewinn_user;

--
-- TOC entry 4288 (class 0 OID 0)
-- Dependencies: 265
-- Name: entity_comparisons_comparison_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: reviewinn_user
--

ALTER SEQUENCE public.entity_comparisons_comparison_id_seq OWNED BY public.entity_comparisons.comparison_id;


--
-- TOC entry 295 (class 1259 OID 17232)
-- Name: entity_metadata; Type: TABLE; Schema: public; Owner: reviewinn_user
--

CREATE TABLE public.entity_metadata (
    metadata_id bigint NOT NULL,
    entity_id bigint,
    field_name character varying NOT NULL,
    field_type character varying,
    options json,
    is_required boolean,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.entity_metadata OWNER TO reviewinn_user;

--
-- TOC entry 294 (class 1259 OID 17231)
-- Name: entity_metadata_metadata_id_seq; Type: SEQUENCE; Schema: public; Owner: reviewinn_user
--

CREATE SEQUENCE public.entity_metadata_metadata_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.entity_metadata_metadata_id_seq OWNER TO reviewinn_user;

--
-- TOC entry 4289 (class 0 OID 0)
-- Dependencies: 294
-- Name: entity_metadata_metadata_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: reviewinn_user
--

ALTER SEQUENCE public.entity_metadata_metadata_id_seq OWNED BY public.entity_metadata.metadata_id;


--
-- TOC entry 279 (class 1259 OID 17064)
-- Name: entity_relations; Type: TABLE; Schema: public; Owner: reviewinn_user
--

CREATE TABLE public.entity_relations (
    entity_id integer NOT NULL,
    related_entity_id integer NOT NULL
);


ALTER TABLE public.entity_relations OWNER TO reviewinn_user;

--
-- TOC entry 293 (class 1259 OID 17215)
-- Name: entity_roles; Type: TABLE; Schema: public; Owner: reviewinn_user
--

CREATE TABLE public.entity_roles (
    role_id bigint NOT NULL,
    entity_id bigint,
    title character varying NOT NULL,
    organization character varying,
    start_date timestamp without time zone,
    end_date timestamp without time zone,
    is_current boolean,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.entity_roles OWNER TO reviewinn_user;

--
-- TOC entry 292 (class 1259 OID 17214)
-- Name: entity_roles_role_id_seq; Type: SEQUENCE; Schema: public; Owner: reviewinn_user
--

CREATE SEQUENCE public.entity_roles_role_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.entity_roles_role_id_seq OWNER TO reviewinn_user;

--
-- TOC entry 4290 (class 0 OID 0)
-- Dependencies: 292
-- Name: entity_roles_role_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: reviewinn_user
--

ALTER SEQUENCE public.entity_roles_role_id_seq OWNED BY public.entity_roles.role_id;


--
-- TOC entry 302 (class 1259 OID 17301)
-- Name: entity_views; Type: TABLE; Schema: public; Owner: reviewinn_user
--

CREATE TABLE public.entity_views (
    view_id bigint NOT NULL,
    entity_id integer NOT NULL,
    user_id integer,
    ip_address character varying(45),
    user_agent character varying(500),
    session_id character varying(100),
    viewed_at timestamp with time zone DEFAULT now(),
    expires_at timestamp with time zone,
    is_valid boolean,
    is_unique_user boolean,
    is_unique_session boolean
);


ALTER TABLE public.entity_views OWNER TO reviewinn_user;

--
-- TOC entry 301 (class 1259 OID 17300)
-- Name: entity_views_view_id_seq; Type: SEQUENCE; Schema: public; Owner: reviewinn_user
--

CREATE SEQUENCE public.entity_views_view_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.entity_views_view_id_seq OWNER TO reviewinn_user;

--
-- TOC entry 4291 (class 0 OID 0)
-- Dependencies: 301
-- Name: entity_views_view_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: reviewinn_user
--

ALTER SEQUENCE public.entity_views_view_id_seq OWNED BY public.entity_views.view_id;


--
-- TOC entry 231 (class 1259 OID 16542)
-- Name: followers; Type: TABLE; Schema: public; Owner: reviewinn_user
--

CREATE TABLE public.followers (
    user_id integer NOT NULL,
    follower_user_id integer NOT NULL
);


ALTER TABLE public.followers OWNER TO reviewinn_user;

--
-- TOC entry 230 (class 1259 OID 16527)
-- Name: group_categories; Type: TABLE; Schema: public; Owner: reviewinn_user
--

CREATE TABLE public.group_categories (
    category_id integer NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    icon character varying(100),
    color_code character varying(7),
    parent_category_id integer,
    sort_order integer,
    is_active boolean,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.group_categories OWNER TO reviewinn_user;

--
-- TOC entry 229 (class 1259 OID 16526)
-- Name: group_categories_category_id_seq; Type: SEQUENCE; Schema: public; Owner: reviewinn_user
--

CREATE SEQUENCE public.group_categories_category_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.group_categories_category_id_seq OWNER TO reviewinn_user;

--
-- TOC entry 4292 (class 0 OID 0)
-- Dependencies: 229
-- Name: group_categories_category_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: reviewinn_user
--

ALTER SEQUENCE public.group_categories_category_id_seq OWNED BY public.group_categories.category_id;


--
-- TOC entry 307 (class 1259 OID 17384)
-- Name: group_category_mappings; Type: TABLE; Schema: public; Owner: reviewinn_user
--

CREATE TABLE public.group_category_mappings (
    group_id integer NOT NULL,
    category_id integer NOT NULL
);


ALTER TABLE public.group_category_mappings OWNER TO reviewinn_user;

--
-- TOC entry 306 (class 1259 OID 17356)
-- Name: group_invitations; Type: TABLE; Schema: public; Owner: reviewinn_user
--

CREATE TABLE public.group_invitations (
    invitation_id integer NOT NULL,
    group_id integer NOT NULL,
    inviter_id integer NOT NULL,
    invitee_id integer NOT NULL,
    invitation_message text,
    suggested_role character varying(30),
    status character varying(20),
    response_message text,
    created_at timestamp with time zone DEFAULT now(),
    responded_at timestamp with time zone,
    expires_at timestamp with time zone
);


ALTER TABLE public.group_invitations OWNER TO reviewinn_user;

--
-- TOC entry 305 (class 1259 OID 17355)
-- Name: group_invitations_invitation_id_seq; Type: SEQUENCE; Schema: public; Owner: reviewinn_user
--

CREATE SEQUENCE public.group_invitations_invitation_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.group_invitations_invitation_id_seq OWNER TO reviewinn_user;

--
-- TOC entry 4293 (class 0 OID 0)
-- Dependencies: 305
-- Name: group_invitations_invitation_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: reviewinn_user
--

ALTER SEQUENCE public.group_invitations_invitation_id_seq OWNED BY public.group_invitations.invitation_id;


--
-- TOC entry 304 (class 1259 OID 17325)
-- Name: group_memberships; Type: TABLE; Schema: public; Owner: reviewinn_user
--

CREATE TABLE public.group_memberships (
    membership_id integer NOT NULL,
    group_id integer NOT NULL,
    user_id integer NOT NULL,
    role character varying(30),
    membership_status character varying(20),
    can_post_reviews boolean,
    can_moderate_content boolean,
    can_invite_members boolean,
    can_manage_group boolean,
    reviews_count integer,
    last_activity_at timestamp with time zone,
    contribution_score double precision,
    joined_at timestamp with time zone DEFAULT now(),
    invited_by integer,
    join_reason text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.group_memberships OWNER TO reviewinn_user;

--
-- TOC entry 303 (class 1259 OID 17324)
-- Name: group_memberships_membership_id_seq; Type: SEQUENCE; Schema: public; Owner: reviewinn_user
--

CREATE SEQUENCE public.group_memberships_membership_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.group_memberships_membership_id_seq OWNER TO reviewinn_user;

--
-- TOC entry 4294 (class 0 OID 0)
-- Dependencies: 303
-- Name: group_memberships_membership_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: reviewinn_user
--

ALTER SEQUENCE public.group_memberships_membership_id_seq OWNED BY public.group_memberships.membership_id;


--
-- TOC entry 238 (class 1259 OID 16621)
-- Name: msg_conversation_participants; Type: TABLE; Schema: public; Owner: reviewinn_user
--

CREATE TABLE public.msg_conversation_participants (
    participant_id integer NOT NULL,
    conversation_id integer,
    user_id integer,
    role character varying(20),
    joined_at timestamp with time zone DEFAULT now(),
    left_at timestamp with time zone,
    notification_preferences jsonb,
    last_read_at timestamp with time zone DEFAULT now(),
    unread_count integer
);


ALTER TABLE public.msg_conversation_participants OWNER TO reviewinn_user;

--
-- TOC entry 237 (class 1259 OID 16620)
-- Name: msg_conversation_participants_participant_id_seq; Type: SEQUENCE; Schema: public; Owner: reviewinn_user
--

CREATE SEQUENCE public.msg_conversation_participants_participant_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.msg_conversation_participants_participant_id_seq OWNER TO reviewinn_user;

--
-- TOC entry 4295 (class 0 OID 0)
-- Dependencies: 237
-- Name: msg_conversation_participants_participant_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: reviewinn_user
--

ALTER SEQUENCE public.msg_conversation_participants_participant_id_seq OWNED BY public.msg_conversation_participants.participant_id;


--
-- TOC entry 222 (class 1259 OID 16471)
-- Name: msg_conversations; Type: TABLE; Schema: public; Owner: reviewinn_user
--

CREATE TABLE public.msg_conversations (
    conversation_id integer NOT NULL,
    conversation_type character varying(20),
    title character varying(200),
    is_private boolean,
    max_participants integer,
    conversation_metadata jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.msg_conversations OWNER TO reviewinn_user;

--
-- TOC entry 221 (class 1259 OID 16470)
-- Name: msg_conversations_conversation_id_seq; Type: SEQUENCE; Schema: public; Owner: reviewinn_user
--

CREATE SEQUENCE public.msg_conversations_conversation_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.msg_conversations_conversation_id_seq OWNER TO reviewinn_user;

--
-- TOC entry 4296 (class 0 OID 0)
-- Dependencies: 221
-- Name: msg_conversations_conversation_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: reviewinn_user
--

ALTER SEQUENCE public.msg_conversations_conversation_id_seq OWNED BY public.msg_conversations.conversation_id;


--
-- TOC entry 281 (class 1259 OID 17080)
-- Name: msg_message_attachments; Type: TABLE; Schema: public; Owner: reviewinn_user
--

CREATE TABLE public.msg_message_attachments (
    attachment_id integer NOT NULL,
    message_id integer,
    file_name character varying(255),
    file_size integer,
    file_type character varying(100),
    file_url character varying(500),
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.msg_message_attachments OWNER TO reviewinn_user;

--
-- TOC entry 280 (class 1259 OID 17079)
-- Name: msg_message_attachments_attachment_id_seq; Type: SEQUENCE; Schema: public; Owner: reviewinn_user
--

CREATE SEQUENCE public.msg_message_attachments_attachment_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.msg_message_attachments_attachment_id_seq OWNER TO reviewinn_user;

--
-- TOC entry 4297 (class 0 OID 0)
-- Dependencies: 280
-- Name: msg_message_attachments_attachment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: reviewinn_user
--

ALTER SEQUENCE public.msg_message_attachments_attachment_id_seq OWNED BY public.msg_message_attachments.attachment_id;


--
-- TOC entry 291 (class 1259 OID 17193)
-- Name: msg_message_mentions; Type: TABLE; Schema: public; Owner: reviewinn_user
--

CREATE TABLE public.msg_message_mentions (
    mention_id integer NOT NULL,
    message_id integer NOT NULL,
    mentioned_user_id integer NOT NULL,
    mention_type character varying(20),
    start_position integer,
    end_position integer,
    mention_text character varying(100),
    is_acknowledged boolean,
    acknowledged_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.msg_message_mentions OWNER TO reviewinn_user;

--
-- TOC entry 290 (class 1259 OID 17192)
-- Name: msg_message_mentions_mention_id_seq; Type: SEQUENCE; Schema: public; Owner: reviewinn_user
--

CREATE SEQUENCE public.msg_message_mentions_mention_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.msg_message_mentions_mention_id_seq OWNER TO reviewinn_user;

--
-- TOC entry 4298 (class 0 OID 0)
-- Dependencies: 290
-- Name: msg_message_mentions_mention_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: reviewinn_user
--

ALTER SEQUENCE public.msg_message_mentions_mention_id_seq OWNED BY public.msg_message_mentions.mention_id;


--
-- TOC entry 289 (class 1259 OID 17167)
-- Name: msg_message_pins; Type: TABLE; Schema: public; Owner: reviewinn_user
--

CREATE TABLE public.msg_message_pins (
    pin_id integer NOT NULL,
    conversation_id integer NOT NULL,
    message_id integer NOT NULL,
    pinned_by_user_id integer NOT NULL,
    pin_reason character varying(255),
    is_active boolean,
    pinned_at timestamp with time zone DEFAULT now(),
    unpinned_at timestamp with time zone
);


ALTER TABLE public.msg_message_pins OWNER TO reviewinn_user;

--
-- TOC entry 288 (class 1259 OID 17166)
-- Name: msg_message_pins_pin_id_seq; Type: SEQUENCE; Schema: public; Owner: reviewinn_user
--

CREATE SEQUENCE public.msg_message_pins_pin_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.msg_message_pins_pin_id_seq OWNER TO reviewinn_user;

--
-- TOC entry 4299 (class 0 OID 0)
-- Dependencies: 288
-- Name: msg_message_pins_pin_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: reviewinn_user
--

ALTER SEQUENCE public.msg_message_pins_pin_id_seq OWNED BY public.msg_message_pins.pin_id;


--
-- TOC entry 283 (class 1259 OID 17096)
-- Name: msg_message_reactions; Type: TABLE; Schema: public; Owner: reviewinn_user
--

CREATE TABLE public.msg_message_reactions (
    reaction_id integer NOT NULL,
    message_id integer,
    user_id integer,
    reaction_type character varying(50),
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.msg_message_reactions OWNER TO reviewinn_user;

--
-- TOC entry 282 (class 1259 OID 17095)
-- Name: msg_message_reactions_reaction_id_seq; Type: SEQUENCE; Schema: public; Owner: reviewinn_user
--

CREATE SEQUENCE public.msg_message_reactions_reaction_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.msg_message_reactions_reaction_id_seq OWNER TO reviewinn_user;

--
-- TOC entry 4300 (class 0 OID 0)
-- Dependencies: 282
-- Name: msg_message_reactions_reaction_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: reviewinn_user
--

ALTER SEQUENCE public.msg_message_reactions_reaction_id_seq OWNED BY public.msg_message_reactions.reaction_id;


--
-- TOC entry 285 (class 1259 OID 17115)
-- Name: msg_message_status; Type: TABLE; Schema: public; Owner: reviewinn_user
--

CREATE TABLE public.msg_message_status (
    status_id integer NOT NULL,
    message_id integer NOT NULL,
    user_id integer NOT NULL,
    status character varying(20),
    delivered_at timestamp with time zone,
    read_at timestamp with time zone,
    failed_reason character varying(255),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.msg_message_status OWNER TO reviewinn_user;

--
-- TOC entry 284 (class 1259 OID 17114)
-- Name: msg_message_status_status_id_seq; Type: SEQUENCE; Schema: public; Owner: reviewinn_user
--

CREATE SEQUENCE public.msg_message_status_status_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.msg_message_status_status_id_seq OWNER TO reviewinn_user;

--
-- TOC entry 4301 (class 0 OID 0)
-- Dependencies: 284
-- Name: msg_message_status_status_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: reviewinn_user
--

ALTER SEQUENCE public.msg_message_status_status_id_seq OWNED BY public.msg_message_status.status_id;


--
-- TOC entry 240 (class 1259 OID 16643)
-- Name: msg_messages; Type: TABLE; Schema: public; Owner: reviewinn_user
--

CREATE TABLE public.msg_messages (
    message_id integer NOT NULL,
    conversation_id integer,
    sender_id integer,
    reply_to_message_id integer,
    content text NOT NULL,
    message_type character varying(20),
    is_edited boolean,
    is_deleted boolean,
    message_metadata jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.msg_messages OWNER TO reviewinn_user;

--
-- TOC entry 239 (class 1259 OID 16642)
-- Name: msg_messages_message_id_seq; Type: SEQUENCE; Schema: public; Owner: reviewinn_user
--

CREATE SEQUENCE public.msg_messages_message_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.msg_messages_message_id_seq OWNER TO reviewinn_user;

--
-- TOC entry 4302 (class 0 OID 0)
-- Dependencies: 239
-- Name: msg_messages_message_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: reviewinn_user
--

ALTER SEQUENCE public.msg_messages_message_id_seq OWNED BY public.msg_messages.message_id;


--
-- TOC entry 287 (class 1259 OID 17137)
-- Name: msg_threads; Type: TABLE; Schema: public; Owner: reviewinn_user
--

CREATE TABLE public.msg_threads (
    thread_id integer NOT NULL,
    conversation_id integer NOT NULL,
    parent_message_id integer NOT NULL,
    thread_title character varying(255),
    reply_count integer,
    participant_count integer,
    last_reply_at timestamp with time zone,
    last_reply_user_id integer,
    is_archived boolean,
    thread_metadata jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.msg_threads OWNER TO reviewinn_user;

--
-- TOC entry 286 (class 1259 OID 17136)
-- Name: msg_threads_thread_id_seq; Type: SEQUENCE; Schema: public; Owner: reviewinn_user
--

CREATE SEQUENCE public.msg_threads_thread_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.msg_threads_thread_id_seq OWNER TO reviewinn_user;

--
-- TOC entry 4303 (class 0 OID 0)
-- Dependencies: 286
-- Name: msg_threads_thread_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: reviewinn_user
--

ALTER SEQUENCE public.msg_threads_thread_id_seq OWNED BY public.msg_threads.thread_id;


--
-- TOC entry 242 (class 1259 OID 16670)
-- Name: msg_typing_indicators; Type: TABLE; Schema: public; Owner: reviewinn_user
--

CREATE TABLE public.msg_typing_indicators (
    typing_id integer NOT NULL,
    conversation_id integer NOT NULL,
    user_id integer NOT NULL,
    is_typing boolean,
    started_at timestamp with time zone DEFAULT now(),
    last_activity timestamp with time zone DEFAULT now()
);


ALTER TABLE public.msg_typing_indicators OWNER TO reviewinn_user;

--
-- TOC entry 241 (class 1259 OID 16669)
-- Name: msg_typing_indicators_typing_id_seq; Type: SEQUENCE; Schema: public; Owner: reviewinn_user
--

CREATE SEQUENCE public.msg_typing_indicators_typing_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.msg_typing_indicators_typing_id_seq OWNER TO reviewinn_user;

--
-- TOC entry 4304 (class 0 OID 0)
-- Dependencies: 241
-- Name: msg_typing_indicators_typing_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: reviewinn_user
--

ALTER SEQUENCE public.msg_typing_indicators_typing_id_seq OWNED BY public.msg_typing_indicators.typing_id;


--
-- TOC entry 244 (class 1259 OID 16692)
-- Name: msg_user_presence; Type: TABLE; Schema: public; Owner: reviewinn_user
--

CREATE TABLE public.msg_user_presence (
    presence_id integer NOT NULL,
    user_id integer NOT NULL,
    status character varying(20),
    last_seen timestamp with time zone DEFAULT now(),
    is_online boolean,
    show_last_seen boolean,
    show_online_status boolean,
    device_info jsonb,
    session_data jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.msg_user_presence OWNER TO reviewinn_user;

--
-- TOC entry 243 (class 1259 OID 16691)
-- Name: msg_user_presence_presence_id_seq; Type: SEQUENCE; Schema: public; Owner: reviewinn_user
--

CREATE SEQUENCE public.msg_user_presence_presence_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.msg_user_presence_presence_id_seq OWNER TO reviewinn_user;

--
-- TOC entry 4305 (class 0 OID 0)
-- Dependencies: 243
-- Name: msg_user_presence_presence_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: reviewinn_user
--

ALTER SEQUENCE public.msg_user_presence_presence_id_seq OWNED BY public.msg_user_presence.presence_id;


--
-- TOC entry 317 (class 1259 OID 17488)
-- Name: review_comment_reactions; Type: TABLE; Schema: public; Owner: reviewinn_user
--

CREATE TABLE public.review_comment_reactions (
    reaction_id integer NOT NULL,
    comment_id integer NOT NULL,
    user_id integer NOT NULL,
    reaction_type public.comment_reaction_type NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.review_comment_reactions OWNER TO reviewinn_user;

--
-- TOC entry 316 (class 1259 OID 17487)
-- Name: review_comment_reactions_reaction_id_seq; Type: SEQUENCE; Schema: public; Owner: reviewinn_user
--

CREATE SEQUENCE public.review_comment_reactions_reaction_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.review_comment_reactions_reaction_id_seq OWNER TO reviewinn_user;

--
-- TOC entry 4306 (class 0 OID 0)
-- Dependencies: 316
-- Name: review_comment_reactions_reaction_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: reviewinn_user
--

ALTER SEQUENCE public.review_comment_reactions_reaction_id_seq OWNED BY public.review_comment_reactions.reaction_id;


--
-- TOC entry 309 (class 1259 OID 17400)
-- Name: review_comments; Type: TABLE; Schema: public; Owner: reviewinn_user
--

CREATE TABLE public.review_comments (
    comment_id integer NOT NULL,
    review_id integer,
    user_id integer,
    content text NOT NULL,
    is_anonymous boolean,
    is_verified boolean,
    reaction_count integer,
    helpful_votes integer,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.review_comments OWNER TO reviewinn_user;

--
-- TOC entry 308 (class 1259 OID 17399)
-- Name: review_comments_comment_id_seq; Type: SEQUENCE; Schema: public; Owner: reviewinn_user
--

CREATE SEQUENCE public.review_comments_comment_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.review_comments_comment_id_seq OWNER TO reviewinn_user;

--
-- TOC entry 4307 (class 0 OID 0)
-- Dependencies: 308
-- Name: review_comments_comment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: reviewinn_user
--

ALTER SEQUENCE public.review_comments_comment_id_seq OWNED BY public.review_comments.comment_id;


--
-- TOC entry 276 (class 1259 OID 17025)
-- Name: review_groups; Type: TABLE; Schema: public; Owner: reviewinn_user
--

CREATE TABLE public.review_groups (
    group_id integer NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    group_type character varying(50),
    visibility character varying(20),
    avatar_url character varying(500),
    cover_image_url character varying(500),
    allow_public_reviews boolean,
    require_approval_for_reviews boolean,
    max_members integer,
    created_by integer,
    group_metadata jsonb,
    rules_and_guidelines text,
    external_links jsonb,
    member_count integer,
    review_count integer,
    active_members_count integer,
    is_active boolean,
    is_verified boolean,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.review_groups OWNER TO reviewinn_user;

--
-- TOC entry 275 (class 1259 OID 17024)
-- Name: review_groups_group_id_seq; Type: SEQUENCE; Schema: public; Owner: reviewinn_user
--

CREATE SEQUENCE public.review_groups_group_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.review_groups_group_id_seq OWNER TO reviewinn_user;

--
-- TOC entry 4308 (class 0 OID 0)
-- Dependencies: 275
-- Name: review_groups_group_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: reviewinn_user
--

ALTER SEQUENCE public.review_groups_group_id_seq OWNED BY public.review_groups.group_id;


--
-- TOC entry 278 (class 1259 OID 17043)
-- Name: review_main; Type: TABLE; Schema: public; Owner: reviewinn_user
--

CREATE TABLE public.review_main (
    review_id integer NOT NULL,
    user_id integer NOT NULL,
    entity_id integer NOT NULL,
    role_id integer,
    title character varying(200),
    content text NOT NULL,
    overall_rating double precision NOT NULL,
    is_anonymous boolean,
    is_verified boolean,
    view_count integer NOT NULL,
    reaction_count integer NOT NULL,
    comment_count integer NOT NULL,
    ratings json,
    pros json,
    cons json,
    images json,
    top_reactions json NOT NULL,
    entity_summary json,
    user_summary json,
    reports_summary json,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.review_main OWNER TO reviewinn_user;

--
-- TOC entry 277 (class 1259 OID 17042)
-- Name: review_main_review_id_seq; Type: SEQUENCE; Schema: public; Owner: reviewinn_user
--

CREATE SEQUENCE public.review_main_review_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.review_main_review_id_seq OWNER TO reviewinn_user;

--
-- TOC entry 4309 (class 0 OID 0)
-- Dependencies: 277
-- Name: review_main_review_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: reviewinn_user
--

ALTER SEQUENCE public.review_main_review_id_seq OWNED BY public.review_main.review_id;


--
-- TOC entry 311 (class 1259 OID 17422)
-- Name: review_reactions; Type: TABLE; Schema: public; Owner: reviewinn_user
--

CREATE TABLE public.review_reactions (
    reaction_id integer NOT NULL,
    review_id integer NOT NULL,
    user_id integer NOT NULL,
    reaction_type public.reaction_type NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.review_reactions OWNER TO reviewinn_user;

--
-- TOC entry 318 (class 1259 OID 17545)
-- Name: review_reaction_analytics_enterprise; Type: VIEW; Schema: public; Owner: reviewinn_user
--

CREATE VIEW public.review_reaction_analytics_enterprise AS
 SELECT date_trunc('day'::text, created_at) AS reaction_date,
    (reaction_type)::character varying(50) AS reaction_type,
    count(*) AS daily_count,
    count(DISTINCT user_id) AS unique_users,
    count(DISTINCT review_id) AS unique_reviews,
    round(((count(*))::numeric / (count(DISTINCT review_id))::numeric), 2) AS avg_reactions_per_review
   FROM public.review_reactions
  WHERE (created_at >= (now() - '30 days'::interval))
  GROUP BY (date_trunc('day'::text, created_at)), reaction_type
  ORDER BY (date_trunc('day'::text, created_at)) DESC, (count(*)) DESC;


ALTER VIEW public.review_reaction_analytics_enterprise OWNER TO reviewinn_user;

--
-- TOC entry 310 (class 1259 OID 17421)
-- Name: review_reactions_reaction_id_seq; Type: SEQUENCE; Schema: public; Owner: reviewinn_user
--

CREATE SEQUENCE public.review_reactions_reaction_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.review_reactions_reaction_id_seq OWNER TO reviewinn_user;

--
-- TOC entry 4310 (class 0 OID 0)
-- Dependencies: 310
-- Name: review_reactions_reaction_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: reviewinn_user
--

ALTER SEQUENCE public.review_reactions_reaction_id_seq OWNED BY public.review_reactions.reaction_id;


--
-- TOC entry 264 (class 1259 OID 16888)
-- Name: review_templates; Type: TABLE; Schema: public; Owner: reviewinn_user
--

CREATE TABLE public.review_templates (
    template_id bigint NOT NULL,
    name character varying(100) NOT NULL,
    unified_category_id bigint,
    template_data json NOT NULL,
    is_public boolean,
    created_by bigint,
    usage_count integer,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.review_templates OWNER TO reviewinn_user;

--
-- TOC entry 263 (class 1259 OID 16887)
-- Name: review_templates_template_id_seq; Type: SEQUENCE; Schema: public; Owner: reviewinn_user
--

CREATE SEQUENCE public.review_templates_template_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.review_templates_template_id_seq OWNER TO reviewinn_user;

--
-- TOC entry 4311 (class 0 OID 0)
-- Dependencies: 263
-- Name: review_templates_template_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: reviewinn_user
--

ALTER SEQUENCE public.review_templates_template_id_seq OWNED BY public.review_templates.template_id;


--
-- TOC entry 313 (class 1259 OID 17442)
-- Name: review_versions; Type: TABLE; Schema: public; Owner: reviewinn_user
--

CREATE TABLE public.review_versions (
    version_id bigint NOT NULL,
    review_id bigint,
    user_id bigint,
    rating integer,
    comment character varying,
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.review_versions OWNER TO reviewinn_user;

--
-- TOC entry 312 (class 1259 OID 17441)
-- Name: review_versions_version_id_seq; Type: SEQUENCE; Schema: public; Owner: reviewinn_user
--

CREATE SEQUENCE public.review_versions_version_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.review_versions_version_id_seq OWNER TO reviewinn_user;

--
-- TOC entry 4312 (class 0 OID 0)
-- Dependencies: 312
-- Name: review_versions_version_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: reviewinn_user
--

ALTER SEQUENCE public.review_versions_version_id_seq OWNED BY public.review_versions.version_id;


--
-- TOC entry 315 (class 1259 OID 17463)
-- Name: review_views; Type: TABLE; Schema: public; Owner: reviewinn_user
--

CREATE TABLE public.review_views (
    view_id bigint NOT NULL,
    review_id integer NOT NULL,
    user_id integer,
    ip_address character varying(45),
    user_agent character varying(500),
    session_id character varying(100),
    viewed_at timestamp with time zone DEFAULT now(),
    expires_at timestamp with time zone,
    is_valid boolean,
    is_unique_user boolean,
    is_unique_session boolean
);


ALTER TABLE public.review_views OWNER TO reviewinn_user;

--
-- TOC entry 314 (class 1259 OID 17462)
-- Name: review_views_view_id_seq; Type: SEQUENCE; Schema: public; Owner: reviewinn_user
--

CREATE SEQUENCE public.review_views_view_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.review_views_view_id_seq OWNER TO reviewinn_user;

--
-- TOC entry 4313 (class 0 OID 0)
-- Dependencies: 314
-- Name: review_views_view_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: reviewinn_user
--

ALTER SEQUENCE public.review_views_view_id_seq OWNED BY public.review_views.view_id;


--
-- TOC entry 299 (class 1259 OID 17269)
-- Name: search_analytics; Type: TABLE; Schema: public; Owner: reviewinn_user
--

CREATE TABLE public.search_analytics (
    search_id bigint NOT NULL,
    user_id bigint,
    query character varying NOT NULL,
    results_count integer,
    clicked_entity_id bigint,
    search_date timestamp with time zone DEFAULT now(),
    filters json
);


ALTER TABLE public.search_analytics OWNER TO reviewinn_user;

--
-- TOC entry 298 (class 1259 OID 17268)
-- Name: search_analytics_search_id_seq; Type: SEQUENCE; Schema: public; Owner: reviewinn_user
--

CREATE SEQUENCE public.search_analytics_search_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.search_analytics_search_id_seq OWNER TO reviewinn_user;

--
-- TOC entry 4314 (class 0 OID 0)
-- Dependencies: 298
-- Name: search_analytics_search_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: reviewinn_user
--

ALTER SEQUENCE public.search_analytics_search_id_seq OWNED BY public.search_analytics.search_id;


--
-- TOC entry 268 (class 1259 OID 16926)
-- Name: social_circle_blocks; Type: TABLE; Schema: public; Owner: reviewinn_user
--

CREATE TABLE public.social_circle_blocks (
    block_id integer NOT NULL,
    blocker_id integer,
    blocked_user_id integer,
    block_reason character varying(500),
    block_type character varying(20),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.social_circle_blocks OWNER TO reviewinn_user;

--
-- TOC entry 267 (class 1259 OID 16925)
-- Name: social_circle_blocks_block_id_seq; Type: SEQUENCE; Schema: public; Owner: reviewinn_user
--

CREATE SEQUENCE public.social_circle_blocks_block_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.social_circle_blocks_block_id_seq OWNER TO reviewinn_user;

--
-- TOC entry 4315 (class 0 OID 0)
-- Dependencies: 267
-- Name: social_circle_blocks_block_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: reviewinn_user
--

ALTER SEQUENCE public.social_circle_blocks_block_id_seq OWNED BY public.social_circle_blocks.block_id;


--
-- TOC entry 270 (class 1259 OID 16950)
-- Name: social_circle_members; Type: TABLE; Schema: public; Owner: reviewinn_user
--

CREATE TABLE public.social_circle_members (
    circle_id integer NOT NULL,
    owner_id integer NOT NULL,
    member_id integer NOT NULL,
    membership_type character varying(50) NOT NULL,
    joined_at timestamp with time zone DEFAULT now(),
    can_see_private_reviews boolean,
    notification_preferences jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.social_circle_members OWNER TO reviewinn_user;

--
-- TOC entry 269 (class 1259 OID 16949)
-- Name: social_circle_members_circle_id_seq; Type: SEQUENCE; Schema: public; Owner: reviewinn_user
--

CREATE SEQUENCE public.social_circle_members_circle_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.social_circle_members_circle_id_seq OWNER TO reviewinn_user;

--
-- TOC entry 4316 (class 0 OID 0)
-- Dependencies: 269
-- Name: social_circle_members_circle_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: reviewinn_user
--

ALTER SEQUENCE public.social_circle_members_circle_id_seq OWNED BY public.social_circle_members.circle_id;


--
-- TOC entry 272 (class 1259 OID 16978)
-- Name: social_circle_requests; Type: TABLE; Schema: public; Owner: reviewinn_user
--

CREATE TABLE public.social_circle_requests (
    request_id integer NOT NULL,
    requester_id integer,
    recipient_id integer,
    request_message text,
    request_type character varying(20),
    status character varying(20),
    response_type character varying(20),
    response_message text,
    requested_at timestamp with time zone DEFAULT now(),
    responded_at timestamp with time zone,
    expires_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.social_circle_requests OWNER TO reviewinn_user;

--
-- TOC entry 271 (class 1259 OID 16977)
-- Name: social_circle_requests_request_id_seq; Type: SEQUENCE; Schema: public; Owner: reviewinn_user
--

CREATE SEQUENCE public.social_circle_requests_request_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.social_circle_requests_request_id_seq OWNER TO reviewinn_user;

--
-- TOC entry 4317 (class 0 OID 0)
-- Dependencies: 271
-- Name: social_circle_requests_request_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: reviewinn_user
--

ALTER SEQUENCE public.social_circle_requests_request_id_seq OWNED BY public.social_circle_requests.request_id;


--
-- TOC entry 224 (class 1259 OID 16483)
-- Name: unified_categories; Type: TABLE; Schema: public; Owner: reviewinn_user
--

CREATE TABLE public.unified_categories (
    id bigint NOT NULL,
    name character varying(200) NOT NULL,
    slug character varying(100) NOT NULL,
    description text,
    parent_id bigint,
    path character varying(500),
    level integer NOT NULL,
    icon character varying(50),
    color character varying(20),
    is_active boolean NOT NULL,
    sort_order integer NOT NULL,
    extra_data jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT check_level_consistency CHECK ((((parent_id IS NULL) AND (level = 1)) OR ((parent_id IS NOT NULL) AND (level > 1))))
);


ALTER TABLE public.unified_categories OWNER TO reviewinn_user;

--
-- TOC entry 223 (class 1259 OID 16482)
-- Name: unified_categories_id_seq; Type: SEQUENCE; Schema: public; Owner: reviewinn_user
--

CREATE SEQUENCE public.unified_categories_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.unified_categories_id_seq OWNER TO reviewinn_user;

--
-- TOC entry 4318 (class 0 OID 0)
-- Dependencies: 223
-- Name: unified_categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: reviewinn_user
--

ALTER SEQUENCE public.unified_categories_id_seq OWNED BY public.unified_categories.id;


--
-- TOC entry 232 (class 1259 OID 16557)
-- Name: user_badges; Type: TABLE; Schema: public; Owner: reviewinn_user
--

CREATE TABLE public.user_badges (
    user_id integer NOT NULL,
    badge_id integer NOT NULL,
    awarded_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.user_badges OWNER TO reviewinn_user;

--
-- TOC entry 246 (class 1259 OID 16725)
-- Name: user_connections; Type: TABLE; Schema: public; Owner: reviewinn_user
--

CREATE TABLE public.user_connections (
    user_id bigint NOT NULL,
    target_user_id bigint NOT NULL,
    connection_type public.connection_type_enum NOT NULL,
    status public.connection_status_enum,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.user_connections OWNER TO reviewinn_user;

--
-- TOC entry 297 (class 1259 OID 17249)
-- Name: user_entity_views; Type: TABLE; Schema: public; Owner: reviewinn_user
--

CREATE TABLE public.user_entity_views (
    view_id integer NOT NULL,
    user_id integer,
    entity_id integer,
    viewed_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.user_entity_views OWNER TO reviewinn_user;

--
-- TOC entry 296 (class 1259 OID 17248)
-- Name: user_entity_views_view_id_seq; Type: SEQUENCE; Schema: public; Owner: reviewinn_user
--

CREATE SEQUENCE public.user_entity_views_view_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_entity_views_view_id_seq OWNER TO reviewinn_user;

--
-- TOC entry 4319 (class 0 OID 0)
-- Dependencies: 296
-- Name: user_entity_views_view_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: reviewinn_user
--

ALTER SEQUENCE public.user_entity_views_view_id_seq OWNED BY public.user_entity_views.view_id;


--
-- TOC entry 251 (class 1259 OID 16777)
-- Name: user_events; Type: TABLE; Schema: public; Owner: reviewinn_user
--

CREATE TABLE public.user_events (
    event_id bigint NOT NULL,
    user_id bigint,
    event_type character varying,
    event_data json,
    occurred_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.user_events OWNER TO reviewinn_user;

--
-- TOC entry 250 (class 1259 OID 16776)
-- Name: user_events_event_id_seq; Type: SEQUENCE; Schema: public; Owner: reviewinn_user
--

CREATE SEQUENCE public.user_events_event_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_events_event_id_seq OWNER TO reviewinn_user;

--
-- TOC entry 4320 (class 0 OID 0)
-- Dependencies: 250
-- Name: user_events_event_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: reviewinn_user
--

ALTER SEQUENCE public.user_events_event_id_seq OWNED BY public.user_events.event_id;


--
-- TOC entry 245 (class 1259 OID 16713)
-- Name: user_profiles; Type: TABLE; Schema: public; Owner: reviewinn_user
--

CREATE TABLE public.user_profiles (
    user_id integer NOT NULL,
    bio character varying,
    first_name character varying(50),
    last_name character varying(50),
    avatar character varying,
    location character varying,
    website character varying,
    created_at timestamp without time zone
);


ALTER TABLE public.user_profiles OWNER TO reviewinn_user;

--
-- TOC entry 254 (class 1259 OID 16810)
-- Name: user_progress; Type: TABLE; Schema: public; Owner: reviewinn_user
--

CREATE TABLE public.user_progress (
    user_id bigint NOT NULL,
    points integer NOT NULL,
    level integer NOT NULL,
    progress_to_next_level integer NOT NULL,
    daily_streak integer NOT NULL,
    last_reviewed date,
    published_reviews integer NOT NULL,
    review_target integer NOT NULL,
    total_helpful_votes integer,
    average_rating_given numeric(3,2),
    entities_reviewed integer,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.user_progress OWNER TO reviewinn_user;

--
-- TOC entry 253 (class 1259 OID 16794)
-- Name: user_search_history; Type: TABLE; Schema: public; Owner: reviewinn_user
--

CREATE TABLE public.user_search_history (
    search_id bigint NOT NULL,
    user_id bigint,
    query character varying NOT NULL,
    matched_entity_ids json,
    searched_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.user_search_history OWNER TO reviewinn_user;

--
-- TOC entry 252 (class 1259 OID 16793)
-- Name: user_search_history_search_id_seq; Type: SEQUENCE; Schema: public; Owner: reviewinn_user
--

CREATE SEQUENCE public.user_search_history_search_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_search_history_search_id_seq OWNER TO reviewinn_user;

--
-- TOC entry 4321 (class 0 OID 0)
-- Dependencies: 252
-- Name: user_search_history_search_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: reviewinn_user
--

ALTER SEQUENCE public.user_search_history_search_id_seq OWNED BY public.user_search_history.search_id;


--
-- TOC entry 248 (class 1259 OID 16743)
-- Name: user_sessions; Type: TABLE; Schema: public; Owner: reviewinn_user
--

CREATE TABLE public.user_sessions (
    session_id bigint NOT NULL,
    user_id bigint NOT NULL,
    token_hash character varying(64) NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    expires_at timestamp with time zone NOT NULL,
    last_accessed timestamp with time zone DEFAULT now(),
    device_info json,
    is_valid boolean,
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.user_sessions OWNER TO reviewinn_user;

--
-- TOC entry 247 (class 1259 OID 16742)
-- Name: user_sessions_session_id_seq; Type: SEQUENCE; Schema: public; Owner: reviewinn_user
--

CREATE SEQUENCE public.user_sessions_session_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_sessions_session_id_seq OWNER TO reviewinn_user;

--
-- TOC entry 4322 (class 0 OID 0)
-- Dependencies: 247
-- Name: user_sessions_session_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: reviewinn_user
--

ALTER SEQUENCE public.user_sessions_session_id_seq OWNED BY public.user_sessions.session_id;


--
-- TOC entry 249 (class 1259 OID 16762)
-- Name: user_settings; Type: TABLE; Schema: public; Owner: reviewinn_user
--

CREATE TABLE public.user_settings (
    user_id bigint NOT NULL,
    privacy_settings json,
    notification_settings json,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.user_settings OWNER TO reviewinn_user;

--
-- TOC entry 228 (class 1259 OID 16516)
-- Name: view_analytics; Type: TABLE; Schema: public; Owner: reviewinn_user
--

CREATE TABLE public.view_analytics (
    analytics_id bigint NOT NULL,
    content_type character varying(20) NOT NULL,
    content_id integer NOT NULL,
    total_views integer,
    unique_users integer,
    unique_sessions integer,
    valid_views integer,
    views_today integer,
    views_this_week integer,
    views_this_month integer,
    last_updated timestamp with time zone DEFAULT now(),
    last_view_at timestamp with time zone
);


ALTER TABLE public.view_analytics OWNER TO reviewinn_user;

--
-- TOC entry 227 (class 1259 OID 16515)
-- Name: view_analytics_analytics_id_seq; Type: SEQUENCE; Schema: public; Owner: reviewinn_user
--

CREATE SEQUENCE public.view_analytics_analytics_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.view_analytics_analytics_id_seq OWNER TO reviewinn_user;

--
-- TOC entry 4323 (class 0 OID 0)
-- Dependencies: 227
-- Name: view_analytics_analytics_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: reviewinn_user
--

ALTER SEQUENCE public.view_analytics_analytics_id_seq OWNED BY public.view_analytics.analytics_id;


--
-- TOC entry 258 (class 1259 OID 16843)
-- Name: weekly_engagement; Type: TABLE; Schema: public; Owner: reviewinn_user
--

CREATE TABLE public.weekly_engagement (
    engagement_id bigint NOT NULL,
    user_id bigint,
    engagement_date date NOT NULL,
    reviews integer NOT NULL,
    reactions integer NOT NULL,
    comments integer NOT NULL,
    reports integer NOT NULL,
    forwards integer NOT NULL,
    points integer NOT NULL,
    streak_broken boolean,
    weekly_rank integer,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.weekly_engagement OWNER TO reviewinn_user;

--
-- TOC entry 257 (class 1259 OID 16842)
-- Name: weekly_engagement_engagement_id_seq; Type: SEQUENCE; Schema: public; Owner: reviewinn_user
--

CREATE SEQUENCE public.weekly_engagement_engagement_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.weekly_engagement_engagement_id_seq OWNER TO reviewinn_user;

--
-- TOC entry 4324 (class 0 OID 0)
-- Dependencies: 257
-- Name: weekly_engagement_engagement_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: reviewinn_user
--

ALTER SEQUENCE public.weekly_engagement_engagement_id_seq OWNED BY public.weekly_engagement.engagement_id;


--
-- TOC entry 262 (class 1259 OID 16873)
-- Name: whats_next_goals; Type: TABLE; Schema: public; Owner: reviewinn_user
--

CREATE TABLE public.whats_next_goals (
    goal_id bigint NOT NULL,
    user_id bigint,
    description character varying(255) NOT NULL,
    target_type character varying(50) NOT NULL,
    target_value integer NOT NULL,
    reward character varying(100) NOT NULL,
    is_completed boolean,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.whats_next_goals OWNER TO reviewinn_user;

--
-- TOC entry 261 (class 1259 OID 16872)
-- Name: whats_next_goals_goal_id_seq; Type: SEQUENCE; Schema: public; Owner: reviewinn_user
--

CREATE SEQUENCE public.whats_next_goals_goal_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.whats_next_goals_goal_id_seq OWNER TO reviewinn_user;

--
-- TOC entry 4325 (class 0 OID 0)
-- Dependencies: 261
-- Name: whats_next_goals_goal_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: reviewinn_user
--

ALTER SEQUENCE public.whats_next_goals_goal_id_seq OWNED BY public.whats_next_goals.goal_id;


--
-- TOC entry 3621 (class 2604 OID 16826)
-- Name: badge_awards award_id; Type: DEFAULT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.badge_awards ALTER COLUMN award_id SET DEFAULT nextval('public.badge_awards_award_id_seq'::regclass);


--
-- TOC entry 3579 (class 2604 OID 16505)
-- Name: badge_definitions badge_definition_id; Type: DEFAULT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.badge_definitions ALTER COLUMN badge_definition_id SET DEFAULT nextval('public.badge_definitions_badge_definition_id_seq'::regclass);


--
-- TOC entry 3572 (class 2604 OID 16464)
-- Name: badges badge_id; Type: DEFAULT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.badges ALTER COLUMN badge_id SET DEFAULT nextval('public.badges_badge_id_seq'::regclass);


--
-- TOC entry 3649 (class 2604 OID 17009)
-- Name: category_questions id; Type: DEFAULT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.category_questions ALTER COLUMN id SET DEFAULT nextval('public.category_questions_id_seq'::regclass);


--
-- TOC entry 3587 (class 2604 OID 16577)
-- Name: core_entities entity_id; Type: DEFAULT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.core_entities ALTER COLUMN entity_id SET DEFAULT nextval('public.core_entities_entity_id_seq'::regclass);


--
-- TOC entry 3589 (class 2604 OID 16594)
-- Name: core_notifications notification_id; Type: DEFAULT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.core_notifications ALTER COLUMN notification_id SET DEFAULT nextval('public.core_notifications_notification_id_seq'::regclass);


--
-- TOC entry 3570 (class 2604 OID 16449)
-- Name: core_users user_id; Type: DEFAULT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.core_users ALTER COLUMN user_id SET DEFAULT nextval('public.core_users_user_id_seq'::regclass);


--
-- TOC entry 3627 (class 2604 OID 16861)
-- Name: daily_tasks task_id; Type: DEFAULT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.daily_tasks ALTER COLUMN task_id SET DEFAULT nextval('public.daily_tasks_task_id_seq'::regclass);


--
-- TOC entry 3636 (class 2604 OID 16913)
-- Name: entity_comparisons comparison_id; Type: DEFAULT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.entity_comparisons ALTER COLUMN comparison_id SET DEFAULT nextval('public.entity_comparisons_comparison_id_seq'::regclass);


--
-- TOC entry 3675 (class 2604 OID 17235)
-- Name: entity_metadata metadata_id; Type: DEFAULT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.entity_metadata ALTER COLUMN metadata_id SET DEFAULT nextval('public.entity_metadata_metadata_id_seq'::regclass);


--
-- TOC entry 3672 (class 2604 OID 17218)
-- Name: entity_roles role_id; Type: DEFAULT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.entity_roles ALTER COLUMN role_id SET DEFAULT nextval('public.entity_roles_role_id_seq'::regclass);


--
-- TOC entry 3684 (class 2604 OID 17304)
-- Name: entity_views view_id; Type: DEFAULT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.entity_views ALTER COLUMN view_id SET DEFAULT nextval('public.entity_views_view_id_seq'::regclass);


--
-- TOC entry 3584 (class 2604 OID 16530)
-- Name: group_categories category_id; Type: DEFAULT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.group_categories ALTER COLUMN category_id SET DEFAULT nextval('public.group_categories_category_id_seq'::regclass);


--
-- TOC entry 3690 (class 2604 OID 17359)
-- Name: group_invitations invitation_id; Type: DEFAULT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.group_invitations ALTER COLUMN invitation_id SET DEFAULT nextval('public.group_invitations_invitation_id_seq'::regclass);


--
-- TOC entry 3686 (class 2604 OID 17328)
-- Name: group_memberships membership_id; Type: DEFAULT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.group_memberships ALTER COLUMN membership_id SET DEFAULT nextval('public.group_memberships_membership_id_seq'::regclass);


--
-- TOC entry 3592 (class 2604 OID 16624)
-- Name: msg_conversation_participants participant_id; Type: DEFAULT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.msg_conversation_participants ALTER COLUMN participant_id SET DEFAULT nextval('public.msg_conversation_participants_participant_id_seq'::regclass);


--
-- TOC entry 3573 (class 2604 OID 16474)
-- Name: msg_conversations conversation_id; Type: DEFAULT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.msg_conversations ALTER COLUMN conversation_id SET DEFAULT nextval('public.msg_conversations_conversation_id_seq'::regclass);


--
-- TOC entry 3658 (class 2604 OID 17083)
-- Name: msg_message_attachments attachment_id; Type: DEFAULT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.msg_message_attachments ALTER COLUMN attachment_id SET DEFAULT nextval('public.msg_message_attachments_attachment_id_seq'::regclass);


--
-- TOC entry 3670 (class 2604 OID 17196)
-- Name: msg_message_mentions mention_id; Type: DEFAULT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.msg_message_mentions ALTER COLUMN mention_id SET DEFAULT nextval('public.msg_message_mentions_mention_id_seq'::regclass);


--
-- TOC entry 3668 (class 2604 OID 17170)
-- Name: msg_message_pins pin_id; Type: DEFAULT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.msg_message_pins ALTER COLUMN pin_id SET DEFAULT nextval('public.msg_message_pins_pin_id_seq'::regclass);


--
-- TOC entry 3660 (class 2604 OID 17099)
-- Name: msg_message_reactions reaction_id; Type: DEFAULT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.msg_message_reactions ALTER COLUMN reaction_id SET DEFAULT nextval('public.msg_message_reactions_reaction_id_seq'::regclass);


--
-- TOC entry 3662 (class 2604 OID 17118)
-- Name: msg_message_status status_id; Type: DEFAULT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.msg_message_status ALTER COLUMN status_id SET DEFAULT nextval('public.msg_message_status_status_id_seq'::regclass);


--
-- TOC entry 3595 (class 2604 OID 16646)
-- Name: msg_messages message_id; Type: DEFAULT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.msg_messages ALTER COLUMN message_id SET DEFAULT nextval('public.msg_messages_message_id_seq'::regclass);


--
-- TOC entry 3665 (class 2604 OID 17140)
-- Name: msg_threads thread_id; Type: DEFAULT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.msg_threads ALTER COLUMN thread_id SET DEFAULT nextval('public.msg_threads_thread_id_seq'::regclass);


--
-- TOC entry 3598 (class 2604 OID 16673)
-- Name: msg_typing_indicators typing_id; Type: DEFAULT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.msg_typing_indicators ALTER COLUMN typing_id SET DEFAULT nextval('public.msg_typing_indicators_typing_id_seq'::regclass);


--
-- TOC entry 3601 (class 2604 OID 16695)
-- Name: msg_user_presence presence_id; Type: DEFAULT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.msg_user_presence ALTER COLUMN presence_id SET DEFAULT nextval('public.msg_user_presence_presence_id_seq'::regclass);


--
-- TOC entry 3702 (class 2604 OID 17491)
-- Name: review_comment_reactions reaction_id; Type: DEFAULT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.review_comment_reactions ALTER COLUMN reaction_id SET DEFAULT nextval('public.review_comment_reactions_reaction_id_seq'::regclass);


--
-- TOC entry 3692 (class 2604 OID 17403)
-- Name: review_comments comment_id; Type: DEFAULT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.review_comments ALTER COLUMN comment_id SET DEFAULT nextval('public.review_comments_comment_id_seq'::regclass);


--
-- TOC entry 3652 (class 2604 OID 17028)
-- Name: review_groups group_id; Type: DEFAULT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.review_groups ALTER COLUMN group_id SET DEFAULT nextval('public.review_groups_group_id_seq'::regclass);


--
-- TOC entry 3655 (class 2604 OID 17046)
-- Name: review_main review_id; Type: DEFAULT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.review_main ALTER COLUMN review_id SET DEFAULT nextval('public.review_main_review_id_seq'::regclass);


--
-- TOC entry 3695 (class 2604 OID 17425)
-- Name: review_reactions reaction_id; Type: DEFAULT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.review_reactions ALTER COLUMN reaction_id SET DEFAULT nextval('public.review_reactions_reaction_id_seq'::regclass);


--
-- TOC entry 3633 (class 2604 OID 16891)
-- Name: review_templates template_id; Type: DEFAULT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.review_templates ALTER COLUMN template_id SET DEFAULT nextval('public.review_templates_template_id_seq'::regclass);


--
-- TOC entry 3698 (class 2604 OID 17445)
-- Name: review_versions version_id; Type: DEFAULT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.review_versions ALTER COLUMN version_id SET DEFAULT nextval('public.review_versions_version_id_seq'::regclass);


--
-- TOC entry 3700 (class 2604 OID 17466)
-- Name: review_views view_id; Type: DEFAULT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.review_views ALTER COLUMN view_id SET DEFAULT nextval('public.review_views_view_id_seq'::regclass);


--
-- TOC entry 3681 (class 2604 OID 17272)
-- Name: search_analytics search_id; Type: DEFAULT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.search_analytics ALTER COLUMN search_id SET DEFAULT nextval('public.search_analytics_search_id_seq'::regclass);


--
-- TOC entry 3638 (class 2604 OID 16929)
-- Name: social_circle_blocks block_id; Type: DEFAULT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.social_circle_blocks ALTER COLUMN block_id SET DEFAULT nextval('public.social_circle_blocks_block_id_seq'::regclass);


--
-- TOC entry 3641 (class 2604 OID 16953)
-- Name: social_circle_members circle_id; Type: DEFAULT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.social_circle_members ALTER COLUMN circle_id SET DEFAULT nextval('public.social_circle_members_circle_id_seq'::regclass);


--
-- TOC entry 3645 (class 2604 OID 16981)
-- Name: social_circle_requests request_id; Type: DEFAULT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.social_circle_requests ALTER COLUMN request_id SET DEFAULT nextval('public.social_circle_requests_request_id_seq'::regclass);


--
-- TOC entry 3576 (class 2604 OID 16486)
-- Name: unified_categories id; Type: DEFAULT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.unified_categories ALTER COLUMN id SET DEFAULT nextval('public.unified_categories_id_seq'::regclass);


--
-- TOC entry 3678 (class 2604 OID 17252)
-- Name: user_entity_views view_id; Type: DEFAULT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.user_entity_views ALTER COLUMN view_id SET DEFAULT nextval('public.user_entity_views_view_id_seq'::regclass);


--
-- TOC entry 3613 (class 2604 OID 16780)
-- Name: user_events event_id; Type: DEFAULT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.user_events ALTER COLUMN event_id SET DEFAULT nextval('public.user_events_event_id_seq'::regclass);


--
-- TOC entry 3616 (class 2604 OID 16797)
-- Name: user_search_history search_id; Type: DEFAULT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.user_search_history ALTER COLUMN search_id SET DEFAULT nextval('public.user_search_history_search_id_seq'::regclass);


--
-- TOC entry 3607 (class 2604 OID 16746)
-- Name: user_sessions session_id; Type: DEFAULT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.user_sessions ALTER COLUMN session_id SET DEFAULT nextval('public.user_sessions_session_id_seq'::regclass);


--
-- TOC entry 3582 (class 2604 OID 16519)
-- Name: view_analytics analytics_id; Type: DEFAULT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.view_analytics ALTER COLUMN analytics_id SET DEFAULT nextval('public.view_analytics_analytics_id_seq'::regclass);


--
-- TOC entry 3624 (class 2604 OID 16846)
-- Name: weekly_engagement engagement_id; Type: DEFAULT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.weekly_engagement ALTER COLUMN engagement_id SET DEFAULT nextval('public.weekly_engagement_engagement_id_seq'::regclass);


--
-- TOC entry 3630 (class 2604 OID 16876)
-- Name: whats_next_goals goal_id; Type: DEFAULT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.whats_next_goals ALTER COLUMN goal_id SET DEFAULT nextval('public.whats_next_goals_goal_id_seq'::regclass);


--
-- TOC entry 4211 (class 0 OID 16823)
-- Dependencies: 256
-- Data for Name: badge_awards; Type: TABLE DATA; Schema: public; Owner: reviewinn_user
--

COPY public.badge_awards (award_id, user_id, badge_definition_id, awarded_at, updated_at) FROM stdin;
\.


--
-- TOC entry 4181 (class 0 OID 16502)
-- Dependencies: 226
-- Data for Name: badge_definitions; Type: TABLE DATA; Schema: public; Owner: reviewinn_user
--

COPY public.badge_definitions (badge_definition_id, name, description, criteria, image_url, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 4175 (class 0 OID 16461)
-- Dependencies: 220
-- Data for Name: badges; Type: TABLE DATA; Schema: public; Owner: reviewinn_user
--

COPY public.badges (badge_id, name, description, icon) FROM stdin;
\.


--
-- TOC entry 4229 (class 0 OID 17006)
-- Dependencies: 274
-- Data for Name: category_questions; Type: TABLE DATA; Schema: public; Owner: reviewinn_user
--

COPY public.category_questions (id, category_path, category_name, category_level, is_root_category, questions, created_at, updated_at, created_by, is_active, usage_count, last_used_at) FROM stdin;
1	other	Other	1	t	[{"key": "quality", "question": "How would you rate the overall quality of this other?", "description": "General quality and standards (1-5 scale)"}, {"key": "service", "question": "How good is the service provided?", "description": "Service quality and customer experience (1-5 scale)"}, {"key": "reliability", "question": "How reliable are they?", "description": "Consistency and dependability (1-5 scale)"}, {"key": "satisfaction", "question": "How satisfied are you overall?", "description": "General satisfaction with the experience (1-5 scale)"}, {"key": "value", "question": "How would you rate the value for money?", "description": "Cost-effectiveness and worth (1-5 scale)"}]	2025-09-02 01:32:52.148751+00	2025-09-02 20:38:02.396218+00	\N	t	7	2025-09-02 20:38:02.396218+00
\.


--
-- TOC entry 4189 (class 0 OID 16574)
-- Dependencies: 234
-- Data for Name: core_entities; Type: TABLE DATA; Schema: public; Owner: reviewinn_user
--

COPY public.core_entities (entity_id, name, description, avatar, website, images, root_category, final_category, is_verified, is_active, is_claimed, claimed_by, claimed_at, metadata, roles, related_entities, business_info, claim_data, view_analytics, average_rating, review_count, view_count, reaction_count, comment_count, created_at, updated_at) FROM stdin;
27	Stanford University	Private research university in Stanford, California	https://images.unsplash.com/photo-1514905552197-0610a4d8fd73?q=80&w=400&h=400&fit=crop	\N	["https://images.unsplash.com/photo-1514905552197-0610a4d8fd73?q=80&w=800", "https://images.unsplash.com/photo-1562630158-e23b8bbf7822?q=80&w=800"]	{"id": 2, "name": "Companies/Institutes", "slug": "companies-institutes"}	{"id": 15, "name": "Education Institutes", "slug": "education-institutes"}	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	4.75	2	0	0	0	2025-08-25 18:40:27.7571+00	2025-09-02 20:59:34.338915+00
30	Mayo Clinic	Nonprofit American academic medical center focused on integrated health care	https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?q=80&w=400&h=400&fit=crop	\N	["https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?q=80&w=800", "https://images.unsplash.com/photo-1559757175-0eb30cd8c063?q=80&w=800"]	{"id": 2, "name": "Companies/Institutes", "slug": "companies-institutes"}	{"id": 19, "name": "Healthcare Institutes", "slug": "healthcare-institutes"}	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	4.9	2	1	0	0	2025-08-25 18:40:27.7571+00	2025-09-02 20:59:34.338915+00
32	iPhone 15 Pro	Latest flagship smartphone from Apple	https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?q=80&w=400&h=400&fit=crop	\N	["https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?q=80&w=800", "https://images.unsplash.com/photo-1603791440384-56cd371ee9a7?q=80&w=800"]	{"id": 4, "name": "Products", "slug": "products"}	{"id": 30, "name": "Electronics", "slug": "electronics"}	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	4.75	4	0	0	0	2025-08-25 18:40:27.7571+00	2025-09-02 20:59:34.338915+00
33	MacBook Pro M3	Professional laptop computer from Apple	https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=400&h=400&fit=crop	\N	["https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=800", "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?q=80&w=800"]	{"id": 4, "name": "Products", "slug": "products"}	{"id": 30, "name": "Electronics", "slug": "electronics"}	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	4.85	2	0	0	0	2025-08-25 18:40:27.7571+00	2025-09-02 20:59:34.338915+00
26	Harvard University	Prestigious private research university in Cambridge, Massachusetts	https://images.unsplash.com/photo-1562813733-b31f71025d54?q=80&w=400&h=400&fit=crop	\N	["https://images.unsplash.com/photo-1562813733-b31f71025d54?q=80&w=800", "https://images.unsplash.com/photo-1607731957617-0c2e7c9d12e5?q=80&w=800"]	{"id": 2, "name": "Companies/Institutes", "slug": "companies-institutes"}	{"id": 15, "name": "Education Institutes", "slug": "education-institutes"}	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	4.666666666666667	3	1	1	0	2025-08-25 18:40:27.7571+00	2025-09-02 20:59:34.338915+00
28	Google LLC	Multinational technology company specializing in Internet-related services	https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?q=80&w=400&h=400&fit=crop	\N	["https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?q=80&w=800", "https://images.unsplash.com/photo-1611224923853-80b023f02d71?q=80&w=800"]	{"id": 2, "name": "Companies/Institutes", "slug": "companies-institutes"}	{"id": 16, "name": "Technology Companies", "slug": "technology-companies"}	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	4.375	4	0	0	0	2025-08-25 18:40:27.7571+00	2025-09-02 20:59:34.338915+00
29	Apple Inc.	Multinational technology company that designs and manufactures consumer electronics	https://images.unsplash.com/photo-1621768216002-5ac171876625?q=80&w=400&h=400&fit=crop	\N	["https://images.unsplash.com/photo-1621768216002-5ac171876625?q=80&w=800", "https://images.unsplash.com/photo-1606229365485-93a3ca8a3789?q=80&w=800"]	{"id": 2, "name": "Companies/Institutes", "slug": "companies-institutes"}	{"id": 16, "name": "Technology Companies", "slug": "technology-companies"}	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	3.75	2	0	0	0	2025-08-25 18:40:27.7571+00	2025-09-02 20:59:34.338915+00
31	The French Laundry	Three-Michelin-starred French restaurant in California	https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=400&h=400&fit=crop	\N	["https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=800", "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?q=80&w=800"]	{"id": 3, "name": "Places", "slug": "places"}	{"id": 24, "name": "Hospitality Places", "slug": "hospitality-places"}	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	4.95	2	0	0	0	2025-08-25 18:40:27.7571+00	2025-09-02 20:59:34.338915+00
34	University of Dhaka	প্রাচীনতম এবং বাংলাদেশের সবচেয়ে প্রতিষ্ঠিত বিশ্ববিদ্যালয়। ১৯২১ সালে প্রতিষ্ঠিত।	https://images.unsplash.com/photo-1523050854058-8df90110c9d1?q=80&w=400&h=400&fit=crop	\N	["https://images.unsplash.com/photo-1523050854058-8df90110c9d1?q=80&w=800", "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800"]	{"id": 1, "name": "Professionals"}	{"id": 6, "name": "Education"}	t	t	t	\N	\N	\N	\N	\N	\N	\N	\N	4.25	2	320	0	0	2025-09-02 21:05:36.877463+00	2025-09-02 21:05:36.886799+00
35	BUET	Bangladesh University of Engineering and Technology - দেশের শীর্ষস্থানীয় প্রকৌশল বিশ্ববিদ্যালয়	https://images.unsplash.com/photo-1562774053-701939374585?q=80&w=400&h=400&fit=crop	\N	["https://images.unsplash.com/photo-1562774053-701939374585?q=80&w=800", "https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?q=80&w=800"]	{"id": 1, "name": "Professionals"}	{"id": 6, "name": "Education"}	t	t	t	\N	\N	\N	\N	\N	\N	\N	\N	4.5	1	280	0	0	2025-09-02 21:05:36.877463+00	2025-09-02 21:05:36.886799+00
36	North South University	বেসরকারি বিশ্ববিদ্যালয় যা উচ্চমানের শিক্ষার জন্য পরিচিত। ১৯৯২ সালে প্রতিষ্ঠিত।	https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?q=80&w=400&h=400&fit=crop	\N	["https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?q=80&w=800", "https://images.unsplash.com/photo-1571260899304-425eee4c7efc?q=80&w=800"]	{"id": 1, "name": "Professionals"}	{"id": 6, "name": "Education"}	t	t	t	\N	\N	\N	\N	\N	\N	\N	\N	4.2	1	195	0	0	2025-09-02 21:05:36.877463+00	2025-09-02 21:05:36.886799+00
49	Daraz Bangladesh	বাংলাদেশের শীর্ষ ই-কমার্স প্ল্যাটফর্ম। Alibaba Group এর অংশ।	https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=400&h=400&fit=crop	\N	["https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=800", "https://images.unsplash.com/photo-1563013544-824ae1b704d3?q=80&w=800"]	{"id": 2, "name": "Companies"}	{"id": 20, "name": "Technology"}	t	t	t	\N	\N	\N	\N	\N	\N	\N	\N	0	0	420	0	0	2025-09-02 21:05:36.877463+00	2025-09-02 21:05:36.886799+00
37	BRAC University	আন্তর্জাতিক মানসম্পন্ন বেসরকারি বিশ্ববিদ্যালয়। গবেষণা এবং উদ্ভাবনে এগিয়ে।	https://images.unsplash.com/photo-1564981797816-1043664bf78d?q=80&w=400&h=400&fit=crop	\N	["https://images.unsplash.com/photo-1564981797816-1043664bf78d?q=80&w=800", "https://images.unsplash.com/photo-1571260899304-425eee4c7efc?q=80&w=800"]	{"id": 1, "name": "Professionals"}	{"id": 6, "name": "Education"}	t	t	t	\N	\N	\N	\N	\N	\N	\N	\N	0	0	210	0	0	2025-09-02 21:05:36.877463+00	2025-09-02 21:05:36.886799+00
38	Grameenphone	বাংলাদেশের বৃহত্তম মোবাইল অপারেটর। গ্রামীণ ব্যাংকের সহযোগিতায় প্রতিষ্ঠিত।	https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=400&h=400&fit=crop	\N	["https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=800", "https://images.unsplash.com/photo-1563770660941-20978e870e26?q=80&w=800"]	{"id": 2, "name": "Companies"}	{"id": 20, "name": "Technology"}	t	t	t	\N	\N	\N	\N	\N	\N	\N	\N	3.8	1	450	0	0	2025-09-02 21:05:36.877463+00	2025-09-02 21:05:36.886799+00
39	Robi Axiata Limited	বাংলাদেশের দ্বিতীয় বৃহত্তম মোবাইল অপারেটর। মালয়েশিয়ার Axiata এর অংশীদারিত্বে।	https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=400&h=400&fit=crop	\N	["https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=800", "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?q=80&w=800"]	{"id": 2, "name": "Companies"}	{"id": 20, "name": "Technology"}	t	t	t	\N	\N	\N	\N	\N	\N	\N	\N	0	0	380	0	0	2025-09-02 21:05:36.877463+00	2025-09-02 21:05:36.886799+00
40	Square Pharmaceuticals	বাংলাদেশের শীর্ষ ওষুধ কোম্পানি। ১৯৫৮ সাল থেকে সেবা প্রদান করছে।	https://images.unsplash.com/photo-1559757148-5c350d0d3c56?q=80&w=400&h=400&fit=crop	\N	["https://images.unsplash.com/photo-1559757148-5c350d0d3c56?q=80&w=800", "https://images.unsplash.com/photo-1576671081837-49000212a370?q=80&w=800"]	{"id": 2, "name": "Companies"}	{"id": 24, "name": "Healthcare"}	t	t	t	\N	\N	\N	\N	\N	\N	\N	\N	0	0	290	0	0	2025-09-02 21:05:36.877463+00	2025-09-02 21:05:36.886799+00
41	ACI Limited	বহুজাতিক কোম্পানি। ওষুধ, কৃষি এবং ভোগ্যপণ্যে নেতৃত্ব প্রদান করছে।	https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=400&h=400&fit=crop	\N	["https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=800", "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?q=80&w=800"]	{"id": 2, "name": "Companies"}	{"id": 26, "name": "Consumer Goods"}	t	t	t	\N	\N	\N	\N	\N	\N	\N	\N	0	0	240	0	0	2025-09-02 21:05:36.877463+00	2025-09-02 21:05:36.886799+00
42	Kasturi Restaurant	ঢাকার অন্যতম জনপ্রিয় রেস্তোরাঁ। ঐতিহ্যবাহী বাংলা খাবারের জন্য বিখ্যাত।	https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?q=80&w=400&h=400&fit=crop	\N	["https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?q=80&w=800", "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=800"]	{"id": 3, "name": "Places"}	{"id": 30, "name": "Hospitality"}	t	t	f	\N	\N	\N	\N	\N	\N	\N	\N	4.2	1	180	0	0	2025-09-02 21:05:36.877463+00	2025-09-02 21:05:36.886799+00
43	Hotel Star	পুরান ঢাকার ঐতিহ্যবাহী হোটেল। বিরিয়ানি এবং কাবাবের জন্য বিখ্যাত।	https://images.unsplash.com/photo-1585937421612-70a008356fbe?q=80&w=400&h=400&fit=crop	\N	["https://images.unsplash.com/photo-1585937421612-70a008356fbe?q=80&w=800", "https://images.unsplash.com/photo-1596560548464-f010549b84d7?q=80&w=800"]	{"id": 3, "name": "Places"}	{"id": 30, "name": "Hospitality"}	f	t	f	\N	\N	\N	\N	\N	\N	\N	\N	0	0	220	0	0	2025-09-02 21:05:36.877463+00	2025-09-02 21:05:36.886799+00
45	Ahsan Manzil	ঢাকার ঐতিহাসিক গোলাপি প্রাসাদ। নবাবদের বাসভবন ছিল। এখন জাদুঘর।	https://images.unsplash.com/photo-1564501049412-61c2a3083791?q=80&w=400&h=400&fit=crop	\N	["https://images.unsplash.com/photo-1564501049412-61c2a3083791?q=80&w=800", "https://images.unsplash.com/photo-1539650116574-75c0c6d73f6e?q=80&w=800"]	{"id": 3, "name": "Places"}	{"id": 35, "name": "Tourism"}	t	t	f	\N	\N	\N	\N	\N	\N	\N	\N	0	0	520	0	0	2025-09-02 21:05:36.877463+00	2025-09-02 21:05:36.886799+00
46	Lalbagh Fort	মুঘল আমলের অসমাপ্ত দুর্গ। ঢাকার অন্যতম ঐতিহাসিক স্থাপনা।	https://images.unsplash.com/photo-1524492412937-b28074a5d7da?q=80&w=400&h=400&fit=crop	\N	["https://images.unsplash.com/photo-1524492412937-b28074a5d7da?q=80&w=800", "https://images.unsplash.com/photo-1548013146-72479768bada?q=80&w=800"]	{"id": 3, "name": "Places"}	{"id": 35, "name": "Tourism"}	t	t	f	\N	\N	\N	\N	\N	\N	\N	\N	0	0	480	0	0	2025-09-02 21:05:36.877463+00	2025-09-02 21:05:36.886799+00
44	Fakruddin Restaurant	বাংলাদেশের অন্যতম জনপ্রিয় রেস্তোরাঁ চেইন। বিরিয়ানি এবং ঐতিহ্যবাহী খাবারের জন্য পরিচিত।	https://images.unsplash.com/photo-1596560548464-f010549b84d7?q=80&w=400&h=400&fit=crop	\N	["https://images.unsplash.com/photo-1596560548464-f010549b84d7?q=80&w=800", "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?q=80&w=800"]	{"id": 3, "name": "Places"}	{"id": 30, "name": "Hospitality"}	t	t	t	\N	\N	\N	\N	\N	\N	\N	\N	4	1	350	0	0	2025-09-02 21:05:36.877463+00	2025-09-02 21:05:36.886799+00
47	Cox's Bazar	বিশ্বের দীর্ঘতম প্রাকৃতিক সমুদ্র সৈকত। ১২০ কিলোমিটার দীর্ঘ।	https://images.unsplash.com/photo-1559827260-dc66d52bef19?q=80&w=400&h=400&fit=crop	\N	["https://images.unsplash.com/photo-1559827260-dc66d52bef19?q=80&w=800", "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=800"]	{"id": 3, "name": "Places"}	{"id": 35, "name": "Tourism"}	t	t	f	\N	\N	\N	\N	\N	\N	\N	\N	4.3	1	750	0	0	2025-09-02 21:05:36.877463+00	2025-09-02 21:05:36.886799+00
48	Sundarbans	বিশ্বের বৃহত্তম ম্যানগ্রোভ বন। রয়েল বেঙ্গল টাইগারের আবাসস্থল। ইউনেস্কো ওয়ার্ল্ড হেরিটেজ সাইট।	https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=400&h=400&fit=crop	\N	["https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=800", "https://images.unsplash.com/photo-1518837695005-2083093ee35b?q=80&w=800"]	{"id": 3, "name": "Places"}	{"id": 35, "name": "Tourism"}	t	t	f	\N	\N	\N	\N	\N	\N	\N	\N	4.8	1	680	0	0	2025-09-02 21:05:36.877463+00	2025-09-02 21:05:36.886799+00
50	Pathao	বাংলাদেশের জনপ্রিয় রাইড শেয়ারিং সার্ভিস। খাদ্য ডেলিভারি এবং পেমেন্ট সার্ভিসও প্রদান করে।	https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?q=80&w=400&h=400&fit=crop	\N	["https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?q=80&w=800", "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?q=80&w=800"]	{"id": 2, "name": "Companies"}	{"id": 20, "name": "Technology"}	t	t	t	\N	\N	\N	\N	\N	\N	\N	\N	4	1	380	0	0	2025-09-02 21:05:36.877463+00	2025-09-02 21:05:36.886799+00
51	Pran RFL Group	বাংলাদেশের অন্যতম বৃহৎ খাদ্য ও পানীয় প্রস্তুতকারক কোম্পানি।	https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=400&h=400&fit=crop	\N	["https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=800", "https://images.unsplash.com/photo-1610832958506-aa56368176cf?q=80&w=800"]	{"id": 4, "name": "Products"}	{"id": 40, "name": "Food & Beverages"}	t	t	t	\N	\N	\N	\N	\N	\N	\N	\N	0	0	290	0	0	2025-09-02 21:05:36.877463+00	2025-09-02 21:05:36.886799+00
52	Akij Food & Beverage	বাংলাদেশের জনপ্রিয় খাদ্য ও পানীয় ব্র্যান্ড। Mojo, Frutika এর জন্য পরিচিত।	https://images.unsplash.com/photo-1571091718767-18b5b1457add?q=80&w=400&h=400&fit=crop	\N	["https://images.unsplash.com/photo-1571091718767-18b5b1457add?q=80&w=800", "https://images.unsplash.com/photo-1610832958506-aa56368176cf?q=80&w=800"]	{"id": 4, "name": "Products"}	{"id": 40, "name": "Food & Beverages"}	t	t	t	\N	\N	\N	\N	\N	\N	\N	\N	0	0	310	0	0	2025-09-02 21:05:36.877463+00	2025-09-02 21:05:36.886799+00
\.


--
-- TOC entry 4191 (class 0 OID 16591)
-- Dependencies: 236
-- Data for Name: core_notifications; Type: TABLE DATA; Schema: public; Owner: reviewinn_user
--

COPY public.core_notifications (notification_id, user_id, actor_id, type, title, content, is_read, priority, delivery_status, entity_type, entity_id, notification_data, expires_at, created_at, updated_at) FROM stdin;
1	1	2	review_reaction	New reaction on your review	reacted thumbs_up to your review: "Great Place to Work..."	f	low	pending	review	6	{"review_id": 6, "review_title": "Great Place to Work", "reaction_type": "thumbs_up"}	2025-09-24 20:54:00.728756+00	2025-08-25 20:54:00.728771+00	2025-08-25 20:54:00.728772+00
2	1	2	review_reaction	New reaction on your review	reacted thumbs_up to your review: "Excellent Academic Experience..."	f	low	pending	review	5	{"review_id": 5, "review_title": "Excellent Academic Experience", "reaction_type": "thumbs_up"}	2025-09-24 21:27:42.911536+00	2025-08-25 21:27:42.911553+00	2025-08-25 21:27:42.911555+00
3	1	2	review_comment	New comment on your review	commented on your review: "good review..."	f	normal	pending	review	6	{"comment_id": 1, "review_title": "Great Place to Work", "comment_content": "good review"}	2025-09-24 21:47:17.450211+00	2025-08-25 21:47:17.450226+00	2025-08-25 21:47:17.450227+00
4	1	2	review_comment	New comment on your review	commented on your review: "lol..."	f	normal	pending	review	5	{"comment_id": 2, "review_title": "Excellent Academic Experience", "comment_content": "lol"}	2025-09-24 21:53:51.90387+00	2025-08-25 21:53:51.903887+00	2025-08-25 21:53:51.903889+00
5	1	2	review_comment	New comment on your review	commented on your review: "Good Mobile..."	f	normal	pending	review	7	{"comment_id": 3, "review_title": "Outstanding Smartphone", "comment_content": "Good Mobile"}	2025-09-24 21:58:56.857148+00	2025-08-25 21:58:56.857164+00	2025-08-25 21:58:56.857165+00
6	1	2	review_comment	New comment on your review	commented on your review: "hello..."	f	normal	pending	review	5	{"comment_id": 8, "review_title": "Excellent Academic Experience", "comment_content": "hello"}	2025-09-24 22:24:06.02605+00	2025-08-25 22:24:06.026063+00	2025-08-25 22:24:06.026064+00
7	1	2	review_reaction	New reaction on your review	reacted celebration to your review: "Outstanding Smartphone..."	f	low	pending	review	7	{"review_id": 7, "review_title": "Outstanding Smartphone", "reaction_type": "celebration"}	2025-09-24 22:31:03.299521+00	2025-08-25 22:31:03.29953+00	2025-08-25 22:31:03.29953+00
8	1	2	review_comment	New comment on your review	commented on your review: "lol..."	f	normal	pending	review	7	{"comment_id": 9, "review_title": "Outstanding Smartphone", "comment_content": "lol"}	2025-09-24 22:31:27.613881+00	2025-08-25 22:31:27.613896+00	2025-08-25 22:31:27.613897+00
9	1	2	review_reaction	New reaction on your review	reacted bomb to your review: "Great Place to Work..."	f	low	pending	review	6	{"review_id": 6, "review_title": "Great Place to Work", "reaction_type": "bomb"}	2025-09-25 01:50:16.494485+00	2025-08-26 01:50:16.494498+00	2025-08-26 01:50:16.4945+00
10	1	2	review_reaction	New reaction on your review	reacted bomb to your review: "Great Place to Work..."	f	low	pending	review	6	{"review_id": 6, "review_title": "Great Place to Work", "reaction_type": "bomb"}	2025-09-25 06:47:07.850701+00	2025-08-26 06:47:07.850716+00	2025-08-26 06:47:07.850717+00
11	1	2	review_reaction	New reaction on your review	reacted haha to your review: "Excellent Academic Experience..."	f	low	pending	review	5	{"review_id": 5, "review_title": "Excellent Academic Experience", "reaction_type": "haha"}	2025-09-25 06:48:04.324301+00	2025-08-26 06:48:04.324314+00	2025-08-26 06:48:04.324315+00
12	1	2	review_reaction	New reaction on your review	reacted bomb to your review: "Great Place to Work..."	f	low	pending	review	6	{"review_id": 6, "review_title": "Great Place to Work", "reaction_type": "bomb"}	2025-09-25 07:30:19.42225+00	2025-08-26 07:30:19.422263+00	2025-08-26 07:30:19.422265+00
13	1	2	review_reaction	New reaction on your review	reacted thumbs_up to your review: "Great Place to Work..."	f	low	pending	review	6	{"review_id": 6, "review_title": "Great Place to Work", "reaction_type": "thumbs_up"}	2025-09-25 07:58:35.597769+00	2025-08-26 07:58:35.597777+00	2025-08-26 07:58:35.597778+00
14	1	2	review_reaction	New reaction on your review	reacted bomb to your review: "Great Place to Work..."	f	low	pending	review	6	{"review_id": 6, "review_title": "Great Place to Work", "reaction_type": "bomb"}	2025-09-25 08:14:33.314369+00	2025-08-26 08:14:33.314384+00	2025-08-26 08:14:33.314385+00
15	1	2	review_reaction	New reaction on your review	reacted bomb to your review: "Great Place to Work..."	f	low	pending	review	6	{"review_id": 6, "review_title": "Great Place to Work", "reaction_type": "bomb"}	2025-09-25 08:29:38.057947+00	2025-08-26 08:29:38.057963+00	2025-08-26 08:29:38.057964+00
16	1	2	review_reaction	New reaction on your review	reacted bomb to your review: "Great Place to Work..."	f	low	pending	review	6	{"review_id": 6, "review_title": "Great Place to Work", "reaction_type": "bomb"}	2025-09-25 08:50:10.571445+00	2025-08-26 08:50:10.571458+00	2025-08-26 08:50:10.571459+00
17	1	2	review_reaction	New reaction on your review	reacted thumbs_up to your review: "Great Place to Work..."	f	low	pending	review	6	{"review_id": 6, "review_title": "Great Place to Work", "reaction_type": "thumbs_up"}	2025-09-25 08:54:54.066946+00	2025-08-26 08:54:54.066961+00	2025-08-26 08:54:54.066962+00
18	1	2	review_reaction	New reaction on your review	reacted haha to your review: "Excellent Academic Experience..."	f	low	pending	review	5	{"review_id": 5, "review_title": "Excellent Academic Experience", "reaction_type": "haha"}	2025-09-25 08:55:22.25679+00	2025-08-26 08:55:22.256802+00	2025-08-26 08:55:22.256803+00
19	1	2	review_reaction	New reaction on your review	reacted love to your review: "Outstanding Smartphone..."	f	low	pending	review	7	{"review_id": 7, "review_title": "Outstanding Smartphone", "reaction_type": "love"}	2025-09-25 08:55:23.598145+00	2025-08-26 08:55:23.598159+00	2025-08-26 08:55:23.598161+00
20	1	2	review_reaction	New reaction on your review	reacted thumbs_up to your review: "Great Place to Work..."	f	low	pending	review	6	{"review_id": 6, "review_title": "Great Place to Work", "reaction_type": "thumbs_up"}	2025-09-30 04:13:17.159391+00	2025-08-31 04:13:17.159403+00	2025-08-31 04:13:17.159403+00
21	1	7	review_reaction	New reaction on your review	reacted thumbs_up to your review: "Great Place to Work..."	f	low	pending	review	6	{"review_id": 6, "review_title": "Great Place to Work", "reaction_type": "thumbs_up"}	2025-09-30 20:57:41.165933+00	2025-08-31 20:57:41.165942+00	2025-08-31 20:57:41.165943+00
22	1	7	review_reaction	New reaction on your review	reacted love to your review: "Excellent Academic Experience..."	f	low	pending	review	5	{"review_id": 5, "review_title": "Excellent Academic Experience", "reaction_type": "love"}	2025-09-30 20:57:45.76977+00	2025-08-31 20:57:45.769783+00	2025-08-31 20:57:45.769784+00
23	1	2	review_reaction	New reaction on your review	reacted bomb to your review: "Great Place to Work..."	f	low	pending	review	6	{"review_id": 6, "review_title": "Great Place to Work", "reaction_type": "bomb"}	2025-10-01 04:54:01.226739+00	2025-09-01 04:54:01.226747+00	2025-09-01 04:54:01.226748+00
24	1	11	review_reaction	New reaction on your review	reacted thumbs_up to your review: "Excellent Academic Experience..."	f	low	pending	review	5	{"review_id": 5, "review_title": "Excellent Academic Experience", "reaction_type": "thumbs_up"}	2025-10-01 16:42:26.582866+00	2025-09-01 16:42:26.582883+00	2025-09-01 16:42:26.582884+00
25	1	11	review_reaction	New reaction on your review	reacted love to your review: "Excellent Academic Experience..."	f	low	pending	review	5	{"review_id": 5, "review_title": "Excellent Academic Experience", "reaction_type": "love"}	2025-10-01 16:42:32.399724+00	2025-09-01 16:42:32.399736+00	2025-09-01 16:42:32.399737+00
26	2	11	comment_reaction	New reaction on your comment	reacted haha to your comment	f	low	pending	comment	1	{"comment_id": 1, "reaction_type": "haha", "comment_content": "good review"}	2025-10-01 16:43:34.13114+00	2025-09-01 16:43:34.13115+00	2025-09-01 16:43:34.13115+00
27	1	11	review_comment	New comment on your review	commented on your review: "This is a test comment from SuperTokens authentica..."	f	normal	pending	review	5	{"comment_id": 10, "review_title": "Excellent Academic Experience", "comment_content": "This is a test comment from SuperTokens authenticated user!"}	2025-10-01 16:43:45.464616+00	2025-09-01 16:43:45.464623+00	2025-09-01 16:43:45.464624+00
28	1	11	review_reaction	New reaction on your review	reacted celebration to your review: "Excellent Academic Experience..."	f	low	pending	review	5	{"review_id": 5, "review_title": "Excellent Academic Experience", "reaction_type": "celebration"}	2025-10-01 16:47:02.988866+00	2025-09-01 16:47:02.988875+00	2025-09-01 16:47:02.988876+00
29	1	11	review_comment	New comment on your review	commented on your review: "Final test - System working perfectly!..."	f	normal	pending	review	5	{"comment_id": 11, "review_title": "Excellent Academic Experience", "comment_content": "Final test - System working perfectly!"}	2025-10-01 16:49:08.267063+00	2025-09-01 16:49:08.267075+00	2025-09-01 16:49:08.267076+00
30	1	14	review_reaction	New reaction on your review	reacted love to your review: "Great Place to Work..."	f	low	pending	review	6	{"review_id": 6, "review_title": "Great Place to Work", "reaction_type": "love"}	2025-10-01 17:53:34.73102+00	2025-09-01 17:53:34.731035+00	2025-09-01 17:53:34.731036+00
31	1	15	review_reaction	New reaction on your review	reacted love to your review: "Great Place to Work..."	f	low	pending	review	6	{"review_id": 6, "review_title": "Great Place to Work", "reaction_type": "love"}	2025-10-01 18:09:52.580482+00	2025-09-01 18:09:52.580499+00	2025-09-01 18:09:52.580501+00
32	1	14	review_reaction	New reaction on your review	reacted bomb to your review: "Great Place to Work..."	f	low	pending	review	6	{"review_id": 6, "review_title": "Great Place to Work", "reaction_type": "bomb"}	2025-10-01 19:06:46.539125+00	2025-09-01 19:06:46.539143+00	2025-09-01 19:06:46.539145+00
33	1	14	review_reaction	New reaction on your review	reacted bomb to your review: "Great Place to Work..."	f	low	pending	review	6	{"review_id": 6, "review_title": "Great Place to Work", "reaction_type": "bomb"}	2025-10-01 19:10:54.686851+00	2025-09-01 19:10:54.686866+00	2025-09-01 19:10:54.686867+00
34	1	14	review_reaction	New reaction on your review	reacted bomb to your review: "Great Place to Work..."	f	low	pending	review	6	{"review_id": 6, "review_title": "Great Place to Work", "reaction_type": "bomb"}	2025-10-01 19:21:33.291372+00	2025-09-01 19:21:33.291386+00	2025-09-01 19:21:33.291388+00
35	1	14	review_reaction	New reaction on your review	reacted bomb to your review: "Great Place to Work..."	f	low	pending	review	6	{"review_id": 6, "review_title": "Great Place to Work", "reaction_type": "bomb"}	2025-10-01 19:48:18.910228+00	2025-09-01 19:48:18.910243+00	2025-09-01 19:48:18.910244+00
36	1	14	review_reaction	New reaction on your review	reacted love to your review: "Excellent Academic Experience..."	f	low	pending	review	5	{"review_id": 5, "review_title": "Excellent Academic Experience", "reaction_type": "love"}	2025-10-01 19:48:39.343506+00	2025-09-01 19:48:39.343519+00	2025-09-01 19:48:39.34352+00
37	1	14	review_reaction	New reaction on your review	reacted thumbs_up to your review: "Great Place to Work..."	f	low	pending	review	6	{"review_id": 6, "review_title": "Great Place to Work", "reaction_type": "thumbs_up"}	2025-10-01 19:58:19.575177+00	2025-09-01 19:58:19.575194+00	2025-09-01 19:58:19.575196+00
38	1	15	review_comment	New comment on your review	commented on your review: "Good and world best company for search engine..."	f	normal	pending	review	6	{"comment_id": 12, "review_title": "Great Place to Work", "comment_content": "Good and world best company for search engine"}	2025-10-02 02:09:37.543213+00	2025-09-02 02:09:37.543228+00	2025-09-02 02:09:37.543229+00
39	1	17	review_reaction	New reaction on your review	reacted love to your review: "Great Place to Work..."	f	low	pending	review	6	{"review_id": 6, "review_title": "Great Place to Work", "reaction_type": "love"}	2025-10-02 16:46:50.116498+00	2025-09-02 16:46:50.116513+00	2025-09-02 16:46:50.116515+00
40	1	17	review_reaction	New reaction on your review	reacted bomb to your review: "Outstanding Smartphone..."	f	low	pending	review	7	{"review_id": 7, "review_title": "Outstanding Smartphone", "reaction_type": "bomb"}	2025-10-02 16:47:26.5715+00	2025-09-02 16:47:26.571513+00	2025-09-02 16:47:26.571514+00
41	1	18	review_reaction	New reaction on your review	reacted bomb to your review: "Great Place to Work..."	f	low	pending	review	6	{"review_id": 6, "review_title": "Great Place to Work", "reaction_type": "bomb"}	2025-10-02 20:00:22.857204+00	2025-09-02 20:00:22.857213+00	2025-09-02 20:00:22.857213+00
42	1	18	review_reaction	New reaction on your review	reacted haha to your review: "Excellent Academic Experience..."	f	low	pending	review	5	{"review_id": 5, "review_title": "Excellent Academic Experience", "reaction_type": "haha"}	2025-10-02 20:37:41.03528+00	2025-09-02 20:37:41.035294+00	2025-09-02 20:37:41.035295+00
\.


--
-- TOC entry 4173 (class 0 OID 16446)
-- Dependencies: 218
-- Data for Name: core_users; Type: TABLE DATA; Schema: public; Owner: reviewinn_user
--

COPY public.core_users (user_id, username, email, hashed_password, first_name, last_name, display_name, avatar, bio, country, city, is_verified, is_active, is_premium, follower_count, following_count, review_count, friend_count, level, points, last_gamification_sync, gamification_sync_version, gamification_sync_status, last_active_at, last_login_at, role, permissions, failed_login_attempts, account_locked_until, password_changed_at, email_verification_token, email_verification_expires, email_verified_at, password_reset_token, password_reset_expires, active_sessions, trusted_devices, security_events, two_factor_enabled, two_factor_secret, recovery_codes, profile_data, preferences, verification_data, favorite_entities, favorite_reviews, favorite_comments, favorite_users, favorite_categories, view_tracking, saved_reviews, followed_entities, notification_preferences, review_interests, blocked_users, created_at, updated_at) FROM stdin;
5	real	real@gmail.com	$2b$14$rwd5r34Cz0BV.V1C/EXXieezhuyO5qIwKLeBHTKOUgBIXOzvBqUbC	Real	Hasan	\N	\N	\N	\N	\N	f	t	f	0	0	0	0	1	0	\N	0	\N	\N	\N	USER	[]	0	\N	\N	\N	\N	\N	\N	\N	[]	[]	[]	f	\N	[]	{}	{}	{}	{}	{}	{}	{}	{}	{}	{}	{}	{}	{}	{}	2025-08-31 20:13:24.059042+00	\N
6	test	test@gmail.com	$2b$14$WjWFXZ.EO0HGFO3KZAnI6.7MiOmEJyh5A4VRye8TspyvXe6RE5xq2	Test	User	\N	\N	\N	\N	\N	t	t	f	0	0	0	0	1	0	\N	0	\N	2025-08-31 20:26:43.307734+00	2025-08-31 20:26:43.307702+00	USER	[]	0	\N	\N	\N	\N	2025-08-31 20:26:32.978958+00	\N	\N	[]	[]	[]	f	\N	[]	{}	{}	{}	{}	{}	{}	{}	{}	{}	{}	{}	{}	{}	{}	2025-08-31 20:21:57.710162+00	2025-08-31 20:26:42.342513+00
15	shopno	shopno@gmail.com	$2b$14$8jwyO6RT34653FZKQVnWgu7Q1H2MIdXJS2l0WFjxCv.o3EtwHkDvi	Shopno	Hasan	\N	\N	\N	\N	\N	t	t	f	0	0	0	0	1	0	\N	0	\N	2025-09-02 02:15:01.49059+00	2025-09-02 02:15:01.490563+00	USER	[]	0	\N	\N	\N	\N	2025-09-01 18:09:34.746057+00	\N	\N	[]	[]	[]	f	\N	[]	{}	{}	{}	{}	{}	{}	{}	{}	{}	{}	{}	{}	{}	{}	2025-09-01 18:09:31.907919+00	2025-09-02 02:15:00.487221+00
7	suzin	suzin@gmail.com	$2b$14$CkP5orKXeLHZFhEQ4dJOOO5q49FB0QDff2EfymyCuDyB3fJkmArFK	Andressa	Suzin	\N	\N	\N	\N	\N	t	t	f	0	0	0	0	1	0	\N	0	\N	2025-08-31 20:57:34.372662+00	2025-08-31 20:57:34.372646+00	USER	[]	0	\N	\N	\N	\N	2025-08-31 20:56:36.731693+00	\N	\N	[]	[]	[]	f	\N	[]	{}	{}	{}	{}	{}	{}	{}	{}	{}	{}	{}	{}	{}	{}	2025-08-31 20:33:23.238221+00	2025-08-31 20:57:33.39113+00
2	tamim	tamim@gmail.com	$2b$14$vfm0S6msSam4TfKc4lHpTesJF1vGhE2FXGWNN/q2xxMRuvKDDSDnW	Tamim	Hasan	\N	\N	\N	\N	\N	t	t	f	0	0	0	0	1	0	\N	0	\N	2025-09-01 04:51:35.799795+00	2025-09-01 04:51:35.799757+00	USER	[]	0	\N	\N	\N	\N	2025-08-25 18:44:59.965807+00	\N	\N	[]	[]	[]	f	\N	[]	{}	{}	{}	{}	{}	{}	{}	{}	{}	{}	{}	{}	{}	{}	2025-08-25 18:44:56.294221+00	2025-09-01 04:51:34.834641+00
1	raja	raja@gmail.com	$2b$14$16mSshRqQypUJC6MUGrcaelf9EgA0Wmd97JCUo.1byKhCWe9XCdLG	Raja	Hasan	\N	\N	\N	\N	\N	t	t	f	0	0	3	0	1	0	\N	0	\N	2025-08-25 08:21:42.452523+00	2025-08-25 08:21:42.452497+00	USER	[]	0	\N	\N	\N	\N	2025-08-25 08:21:31.139282+00	\N	\N	[]	[]	[]	f	\N	[]	{}	{}	{}	{}	{}	{}	{}	{}	{}	{}	{}	{}	{}	{}	2025-08-25 08:21:26.221281+00	2025-08-25 08:21:41.465016+00
9	test_user	test@reviewinn.com		Test	User	Test User	\N	\N	\N	\N	t	t	f	0	0	0	0	1	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-09-01 08:29:51.094286+00	2025-09-01 08:29:51.094286+00
3	ram	ram@gmail.com	$2b$14$gR8JYyF4j1NjbO.nQ/WmAOseHDjhXH8xYipNL0ds/yMNucacASiWS	Ram	Charan	\N	\N	\N	\N	\N	f	t	f	0	0	0	0	1	0	\N	0	\N	\N	\N	USER	[]	0	\N	\N	\N	\N	\N	\N	\N	[]	[]	[]	f	\N	[]	{}	{}	{}	{}	{}	{}	{}	{}	{}	{}	{}	{}	{}	{}	2025-08-30 05:08:46.171453+00	\N
8	durga_test	durga@gmail.com		Durga	Test	Durga Test	\N	\N	\N	\N	t	t	f	0	0	0	0	1	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-09-01 08:28:16.526409+00	2025-09-01 08:37:52.683116+00
11	testuser123_6bf6d3b0	testuser123@gmail.com		\N	\N	Testuser123	https://images.pexels.com/photos/1138903/pexels-photo-1138903.jpeg	\N	\N	\N	f	t	f	0	0	0	0	1	0	\N	0	\N	\N	\N	USER	[]	0	\N	\N	\N	\N	\N	\N	\N	[]	[]	[]	f	\N	[]	{}	{}	{}	{}	{}	{}	{}	{}	{}	{}	{}	{}	{}	{}	2025-09-01 16:33:58.654902+00	2025-09-01 16:37:53.049417+00
12	user_967bc5df_a765676f	user_967bc5df@reviewinn.temp		\N	\N	User_967Bc5Df	https://images.pexels.com/photos/1138903/pexels-photo-1138903.jpeg	\N	\N	\N	f	t	f	0	0	0	0	1	0	\N	0	\N	\N	\N	USER	[]	0	\N	\N	\N	\N	\N	\N	\N	[]	[]	[]	f	\N	[]	{}	{}	{}	{}	{}	{}	{}	{}	{}	{}	{}	{}	{}	{}	2025-09-01 17:18:47.960674+00	\N
13	user_0c48614d_d10a0319	user_0c48614d@reviewinn.temp		\N	\N	User_0C48614D	https://images.pexels.com/photos/1138903/pexels-photo-1138903.jpeg	\N	\N	\N	f	t	f	0	0	0	0	1	0	\N	0	\N	\N	\N	USER	[]	0	\N	\N	\N	\N	\N	\N	\N	[]	[]	[]	f	\N	[]	{}	{}	{}	{}	{}	{}	{}	{}	{}	{}	{}	{}	{}	{}	2025-09-01 17:19:30.682909+00	\N
14	sadman	sadman@gmail.com	$2b$14$1PTCB.J2gRB5YU7JR7HvEuTf7VsctlRk3mZthtHoKjAV1W.pU0kAG	SADMAN	Hasan	\N	\N	\N	\N	\N	t	t	f	0	0	0	0	1	0	\N	0	\N	2025-09-02 02:29:16.67798+00	2025-09-02 02:29:16.677956+00	USER	[]	0	\N	\N	\N	\N	2025-09-01 17:42:36.810739+00	\N	\N	[]	[]	[]	f	\N	[]	{}	{}	{}	{}	{}	{}	{}	{}	{}	{}	{}	{}	{}	{}	2025-09-01 17:42:33.578631+00	2025-09-02 02:29:15.671595+00
17	hasan181	hasan181@umn.edu	$2b$14$sGmjsPXiWzx4w8tVRm0KB.K1mFmDJ4KRqSjZn0HdA/pXQ89MSA0gu	Mahamudul	Hasan	\N	\N	\N	\N	\N	t	t	f	0	0	0	0	1	0	\N	0	\N	2025-09-02 16:46:43.563195+00	2025-09-02 16:46:43.56318+00	USER	[]	0	\N	\N	\N	\N	2025-09-02 16:46:39.493193+00	\N	\N	[]	[]	[]	f	\N	[]	{}	{}	{}	{}	{}	{}	{}	{}	{}	{}	{}	{}	{}	{}	2025-09-02 16:46:36.122302+00	2025-09-02 16:46:42.573985+00
4	odit	odit@gmail.com	$2b$14$iJN6FQic.HhTuRW/EXF3wugBA08VOXqIWau8GBUSGbaMPEo15EQSq	Odit	Hasan	\N	\N	\N	\N	\N	f	t	f	0	0	0	0	1	0	\N	0	\N	\N	\N	USER	[]	0	\N	\N	\N	\N	\N	\N	\N	[]	[]	[]	f	\N	[]	{}	{}	{}	{}	{}	{}	{}	{}	{}	{}	{}	{}	{}	{}	2025-08-31 20:11:01.559371+00	\N
16	test1	test@test.com	$2b$14$5/eow6XZjJPcGTWwsarMeeMDnatwS2Pfbwyp31JqEy7oX3nJBDAaK	Test	User	\N	\N	\N	\N	\N	f	t	f	0	0	0	0	1	0	\N	0	\N	\N	\N	USER	[]	0	\N	\N	\N	\N	\N	\N	\N	[]	[]	[]	f	\N	[]	{}	{}	{}	{}	{}	{}	{}	{}	{}	{}	{}	{}	{}	{}	2025-09-01 23:05:48.198043+00	\N
18	rajesh	rajesh@gmail.com	$2b$14$jF.kEUIiN8Y8dvcBV8WNGuDFTlDzqXh/92gBr7eJqnYznmWRvmdy2	Rajesh	Khan	\N	\N	\N	\N	\N	t	t	f	0	0	0	0	1	0	\N	0	\N	2025-09-02 21:21:52.861277+00	2025-09-02 21:21:52.861262+00	USER	[]	0	\N	\N	\N	\N	2025-09-02 20:00:06.515126+00	\N	\N	[]	[]	[]	f	\N	[]	{}	{}	{}	{}	{}	{}	{}	{}	{}	{}	{}	{}	{}	{}	2025-09-02 20:00:03.55099+00	2025-09-02 21:21:51.872392+00
\.


--
-- TOC entry 4215 (class 0 OID 16858)
-- Dependencies: 260
-- Data for Name: daily_tasks; Type: TABLE DATA; Schema: public; Owner: reviewinn_user
--

COPY public.daily_tasks (task_id, user_id, label, complete, task_date, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 4255 (class 0 OID 17289)
-- Dependencies: 300
-- Data for Name: entity_analytics; Type: TABLE DATA; Schema: public; Owner: reviewinn_user
--

COPY public.entity_analytics (entity_id, total_views, unique_visitors, average_time_on_page, bounce_rate, last_updated) FROM stdin;
\.


--
-- TOC entry 4221 (class 0 OID 16910)
-- Dependencies: 266
-- Data for Name: entity_comparisons; Type: TABLE DATA; Schema: public; Owner: reviewinn_user
--

COPY public.entity_comparisons (comparison_id, user_id, entity_ids, comparison_data, created_at) FROM stdin;
\.


--
-- TOC entry 4250 (class 0 OID 17232)
-- Dependencies: 295
-- Data for Name: entity_metadata; Type: TABLE DATA; Schema: public; Owner: reviewinn_user
--

COPY public.entity_metadata (metadata_id, entity_id, field_name, field_type, options, is_required, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 4234 (class 0 OID 17064)
-- Dependencies: 279
-- Data for Name: entity_relations; Type: TABLE DATA; Schema: public; Owner: reviewinn_user
--

COPY public.entity_relations (entity_id, related_entity_id) FROM stdin;
\.


--
-- TOC entry 4248 (class 0 OID 17215)
-- Dependencies: 293
-- Data for Name: entity_roles; Type: TABLE DATA; Schema: public; Owner: reviewinn_user
--

COPY public.entity_roles (role_id, entity_id, title, organization, start_date, end_date, is_current, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 4257 (class 0 OID 17301)
-- Dependencies: 302
-- Data for Name: entity_views; Type: TABLE DATA; Schema: public; Owner: reviewinn_user
--

COPY public.entity_views (view_id, entity_id, user_id, ip_address, user_agent, session_id, viewed_at, expires_at, is_valid, is_unique_user, is_unique_session) FROM stdin;
1	30	15	172.18.0.6	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	7d87cb01f0403eb25fd1120d501e143e	2025-09-02 01:34:16.408356+00	2025-09-03 01:34:16.416483+00	t	t	t
2	26	15	172.18.0.6	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	21bd0125192d6dfeffaf998b905733bb	2025-09-02 02:08:14.860483+00	2025-09-03 02:08:14.868901+00	t	t	t
\.


--
-- TOC entry 4186 (class 0 OID 16542)
-- Dependencies: 231
-- Data for Name: followers; Type: TABLE DATA; Schema: public; Owner: reviewinn_user
--

COPY public.followers (user_id, follower_user_id) FROM stdin;
\.


--
-- TOC entry 4185 (class 0 OID 16527)
-- Dependencies: 230
-- Data for Name: group_categories; Type: TABLE DATA; Schema: public; Owner: reviewinn_user
--

COPY public.group_categories (category_id, name, description, icon, color_code, parent_category_id, sort_order, is_active, created_at) FROM stdin;
\.


--
-- TOC entry 4262 (class 0 OID 17384)
-- Dependencies: 307
-- Data for Name: group_category_mappings; Type: TABLE DATA; Schema: public; Owner: reviewinn_user
--

COPY public.group_category_mappings (group_id, category_id) FROM stdin;
\.


--
-- TOC entry 4261 (class 0 OID 17356)
-- Dependencies: 306
-- Data for Name: group_invitations; Type: TABLE DATA; Schema: public; Owner: reviewinn_user
--

COPY public.group_invitations (invitation_id, group_id, inviter_id, invitee_id, invitation_message, suggested_role, status, response_message, created_at, responded_at, expires_at) FROM stdin;
\.


--
-- TOC entry 4259 (class 0 OID 17325)
-- Dependencies: 304
-- Data for Name: group_memberships; Type: TABLE DATA; Schema: public; Owner: reviewinn_user
--

COPY public.group_memberships (membership_id, group_id, user_id, role, membership_status, can_post_reviews, can_moderate_content, can_invite_members, can_manage_group, reviews_count, last_activity_at, contribution_score, joined_at, invited_by, join_reason, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 4193 (class 0 OID 16621)
-- Dependencies: 238
-- Data for Name: msg_conversation_participants; Type: TABLE DATA; Schema: public; Owner: reviewinn_user
--

COPY public.msg_conversation_participants (participant_id, conversation_id, user_id, role, joined_at, left_at, notification_preferences, last_read_at, unread_count) FROM stdin;
\.


--
-- TOC entry 4177 (class 0 OID 16471)
-- Dependencies: 222
-- Data for Name: msg_conversations; Type: TABLE DATA; Schema: public; Owner: reviewinn_user
--

COPY public.msg_conversations (conversation_id, conversation_type, title, is_private, max_participants, conversation_metadata, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 4236 (class 0 OID 17080)
-- Dependencies: 281
-- Data for Name: msg_message_attachments; Type: TABLE DATA; Schema: public; Owner: reviewinn_user
--

COPY public.msg_message_attachments (attachment_id, message_id, file_name, file_size, file_type, file_url, created_at) FROM stdin;
\.


--
-- TOC entry 4246 (class 0 OID 17193)
-- Dependencies: 291
-- Data for Name: msg_message_mentions; Type: TABLE DATA; Schema: public; Owner: reviewinn_user
--

COPY public.msg_message_mentions (mention_id, message_id, mentioned_user_id, mention_type, start_position, end_position, mention_text, is_acknowledged, acknowledged_at, created_at) FROM stdin;
\.


--
-- TOC entry 4244 (class 0 OID 17167)
-- Dependencies: 289
-- Data for Name: msg_message_pins; Type: TABLE DATA; Schema: public; Owner: reviewinn_user
--

COPY public.msg_message_pins (pin_id, conversation_id, message_id, pinned_by_user_id, pin_reason, is_active, pinned_at, unpinned_at) FROM stdin;
\.


--
-- TOC entry 4238 (class 0 OID 17096)
-- Dependencies: 283
-- Data for Name: msg_message_reactions; Type: TABLE DATA; Schema: public; Owner: reviewinn_user
--

COPY public.msg_message_reactions (reaction_id, message_id, user_id, reaction_type, created_at) FROM stdin;
\.


--
-- TOC entry 4240 (class 0 OID 17115)
-- Dependencies: 285
-- Data for Name: msg_message_status; Type: TABLE DATA; Schema: public; Owner: reviewinn_user
--

COPY public.msg_message_status (status_id, message_id, user_id, status, delivered_at, read_at, failed_reason, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 4195 (class 0 OID 16643)
-- Dependencies: 240
-- Data for Name: msg_messages; Type: TABLE DATA; Schema: public; Owner: reviewinn_user
--

COPY public.msg_messages (message_id, conversation_id, sender_id, reply_to_message_id, content, message_type, is_edited, is_deleted, message_metadata, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 4242 (class 0 OID 17137)
-- Dependencies: 287
-- Data for Name: msg_threads; Type: TABLE DATA; Schema: public; Owner: reviewinn_user
--

COPY public.msg_threads (thread_id, conversation_id, parent_message_id, thread_title, reply_count, participant_count, last_reply_at, last_reply_user_id, is_archived, thread_metadata, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 4197 (class 0 OID 16670)
-- Dependencies: 242
-- Data for Name: msg_typing_indicators; Type: TABLE DATA; Schema: public; Owner: reviewinn_user
--

COPY public.msg_typing_indicators (typing_id, conversation_id, user_id, is_typing, started_at, last_activity) FROM stdin;
\.


--
-- TOC entry 4199 (class 0 OID 16692)
-- Dependencies: 244
-- Data for Name: msg_user_presence; Type: TABLE DATA; Schema: public; Owner: reviewinn_user
--

COPY public.msg_user_presence (presence_id, user_id, status, last_seen, is_online, show_last_seen, show_online_status, device_info, session_data, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 4272 (class 0 OID 17488)
-- Dependencies: 317
-- Data for Name: review_comment_reactions; Type: TABLE DATA; Schema: public; Owner: reviewinn_user
--

COPY public.review_comment_reactions (reaction_id, comment_id, user_id, reaction_type, created_at, updated_at) FROM stdin;
1	2	2	love	2025-08-25 21:53:56.32339+00	2025-08-25 21:53:56.32339+00
2	3	2	love	2025-08-25 21:59:19.374879+00	2025-08-25 21:59:19.374879+00
3	3	1	thumbs_up	2025-08-25 22:20:30.205575+00	2025-08-25 22:20:30.205575+00
4	8	2	love	2025-08-25 22:24:08.693061+00	2025-08-25 22:24:08.693061+00
5	1	11	haha	2025-09-01 16:43:34.115827+00	2025-09-01 16:43:34.115827+00
\.


--
-- TOC entry 4264 (class 0 OID 17400)
-- Dependencies: 309
-- Data for Name: review_comments; Type: TABLE DATA; Schema: public; Owner: reviewinn_user
--

COPY public.review_comments (comment_id, review_id, user_id, content, is_anonymous, is_verified, reaction_count, helpful_votes, created_at, updated_at) FROM stdin;
2	5	2	lol	f	f	1	0	2025-08-25 21:53:51.895168+00	2025-08-25 21:53:51.895168+00
4	5	2	Test comment to verify trigger	f	f	0	0	2025-08-25 22:14:17.822911+00	2025-08-25 22:14:17.822911+00
3	7	2	Good Mobile	f	f	2	0	2025-08-25 21:58:56.843352+00	2025-08-25 21:58:56.843352+00
8	5	2	hello	f	f	1	0	2025-08-25 22:24:06.011709+00	2025-08-25 22:24:06.011709+00
9	7	2	lol	f	f	0	0	2025-08-25 22:31:27.598222+00	2025-08-25 22:31:27.598222+00
1	6	2	good review	f	f	1	0	2025-08-25 21:47:17.435122+00	2025-08-25 21:47:17.435122+00
10	5	11	This is a test comment from SuperTokens authenticated user!	f	f	0	0	2025-09-01 16:43:45.455053+00	2025-09-01 16:43:45.455053+00
11	5	11	Final test - System working perfectly!	f	f	0	0	2025-09-01 16:49:08.256807+00	2025-09-01 16:49:08.256807+00
12	6	15	Good and world best company for search engine	f	f	0	0	2025-09-02 02:09:37.512133+00	2025-09-02 02:09:37.512133+00
\.


--
-- TOC entry 4231 (class 0 OID 17025)
-- Dependencies: 276
-- Data for Name: review_groups; Type: TABLE DATA; Schema: public; Owner: reviewinn_user
--

COPY public.review_groups (group_id, name, description, group_type, visibility, avatar_url, cover_image_url, allow_public_reviews, require_approval_for_reviews, max_members, created_by, group_metadata, rules_and_guidelines, external_links, member_count, review_count, active_members_count, is_active, is_verified, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 4233 (class 0 OID 17043)
-- Dependencies: 278
-- Data for Name: review_main; Type: TABLE DATA; Schema: public; Owner: reviewinn_user
--

COPY public.review_main (review_id, user_id, entity_id, role_id, title, content, overall_rating, is_anonymous, is_verified, view_count, reaction_count, comment_count, ratings, pros, cons, images, top_reactions, entity_summary, user_summary, reports_summary, created_at, updated_at) FROM stdin;
37	2	34	\N	আমার স্বপ্নের বিশ্ববিদ্যালয়	ছোটবেলা থেকেই ঢাবিতে পড়ার স্বপ্ন ছিল। এখানে পড়ে সেই স্বপ্ন পূরণ হয়েছে। বন্ধুত্ব আর শিক্ষা দুটোই পেয়েছি।	4.5	f	f	38	0	0	\N	["স্বপ্ন পূরণ", "ভালো বন্ধুত্ব", "মানসম্পন্ন শিক্ষা"]	["অতিরিক্ত রাজনীতি", "পরীক্ষায় দেরি"]	\N	{}	\N	\N	\N	2025-08-26 21:05:36.883307+00	2025-08-26 21:05:36.883307+00
5	1	26	\N	Excellent Academic Experience	Harvard provided me with an outstanding education and opened many doors for my career. The faculty is world-class and the resources are unmatched.	5	f	t	2	6	5	\N	["World-class faculty", "Excellent resources", "Great networking opportunities"]	["Very expensive", "Highly competitive environment"]	\N	{"haha": 2, "love": 2, "thumbs_up": 1, "celebration": 1}	{"name": "Harvard University", "avatar": null, "entity_id": 26, "is_claimed": null, "view_count": 0, "description": "Prestigious private research university in Cambridge, Massachusetts", "is_verified": true, "review_count": 1, "root_category": {"id": 2, "name": "Companies/Institutes", "slug": "companies-institutes"}, "average_rating": 5, "final_category": {"id": 15, "name": "Education Institutes", "slug": "education-institutes"}}	{"name": "raja", "level": 1, "avatar": null, "user_id": 1, "username": "raja", "is_verified": true}	\N	2025-08-23 18:40:27.7571+00	2025-09-02 20:37:41.01935+00
40	1	42	\N	বাংলা খাবারের স্বাদ	কস্তুরী রেস্টুরেন্টে খাবারের স্বাদ সত্যিই অসাধারণ। বিশেষ করে ইলিশ ভাজা আর খিচুড়ি দারুণ। পরিবেশ পরিচ্ছন্ন।	4.2	f	f	41	0	0	\N	["স্বাদ অসাধারণ", "পরিচ্ছন্ন পরিবেশ", "ঐতিহ্যবাহী বাংলা খাবার"]	["একটু দামী", "অপেক্ষা করতে হয়", "পার্কিং সমস্যা"]	\N	{}	\N	\N	\N	2025-08-29 21:05:36.883307+00	2025-08-29 21:05:36.883307+00
41	2	47	\N	অসাধারণ সূর্যাস্ত	কক্সবাজার গেলে মন ভরে যায়। বিশেষ করে সূর্যাস্তের দৃশ্য অপরূপ। সমুদ্রের ঢেউয়ের শব্দ মন প্রশান্ত করে। তবে ভিড় একটু বেশি।	4.3	f	f	89	0	0	\N	["অপরূপ সূর্যাস্ত", "দীর্ঘ সমুদ্র সৈকত", "প্রাকৃতিক সৌন্দর্য"]	["অতিরিক্ত ভিড়", "হোটেল দামী", "সমুদ্র দূষণ"]	\N	{}	\N	\N	\N	2025-08-25 21:05:36.883307+00	2025-08-25 21:05:36.883307+00
7	1	32	\N	Outstanding Smartphone	The iPhone 15 Pro is an incredible device with amazing camera quality and performance. Battery life is excellent.	5	f	t	4	2	2	\N	["Amazing camera", "Excellent performance", "Great battery life"]	["Expensive", "No major design changes"]	\N	{"bomb": 1, "love": 1}	{"name": "iPhone 15 Pro", "avatar": null, "entity_id": 32, "is_claimed": null, "view_count": 0, "description": "Latest flagship smartphone from Apple", "is_verified": true, "review_count": 1, "root_category": {"id": 4, "name": "Products", "slug": "products"}, "average_rating": 5, "final_category": {"id": 30, "name": "Electronics", "slug": "electronics"}}	{"name": "raja", "level": 1, "avatar": null, "user_id": 1, "username": "raja", "is_verified": true}	\N	2025-08-22 18:40:27.7571+00	2025-09-02 20:37:41.091836+00
43	4	48	\N	প্রকৃতির অপার সৌন্দর্য	সুন্দরবনে গিয়ে মনে হয়েছে বাংলাদেশ কত সুন্দর। বাঘ দেখার সৌভাগ্য হয়নি তবে বন্যপ্রাণী দেখেছি অনেক। নদীর সৌন্দর্য মুগ্ধ করেছে।	4.8	f	f	73	0	0	\N	["প্রাকৃতিক সৌন্দর্য", "বন্যপ্রাণী", "নদীর দৃশ্য", "পরিবেশ সচেতনতা"]	["বাঘ দেখা কঠিন", "মশার উপদ্রব", "যোগাযোগ ব্যবস্থা কঠিন"]	\N	{}	\N	\N	\N	2025-08-21 21:05:36.883307+00	2025-08-21 21:05:36.883307+00
38	3	35	\N	ইঞ্জিনিয়ারিং এর সেরা	বুয়েট বাংলাদেশের ইঞ্জিনিয়ারিং এর সেরা প্রতিষ্ঠান। এখানকার শিক্ষার মান অসাধারণ। তবে প্রেশার অনেক বেশি।	4.5	f	f	1	0	0	\N	["দেশের সেরা ইঞ্জিনিয়ারিং", "উন্নত ল্যাব সুবিধা", "চাকরির নিশ্চয়তা"]	["অতিরিক্ত প্রেশার", "কঠিন সিলেবাস", "বিনোদনের অভাব"]	\N	{}	\N	\N	\N	2025-08-28 21:05:36.883307+00	2025-09-02 21:09:41.615535+00
42	3	50	\N	সুবিধাজনক সেবা	পাঠাও বাইকের সেবা খুবই সুবিধাজনক। ট্রাফিক জ্যামে আটকে থাকতে হয় না। অ্যাপ ব্যবহার সহজ। কিছু রাইডার আছে যারা ভালো না।	4	f	f	1	0	0	\N	["দ্রুত সেবা", "সহজ অ্যাপ", "ট্রাফিক জ্যাম এড়ানো যায়"]	["কিছু রাইডার অভদ্র", "বৃষ্টিতে সেবা কম", "হেলমেট সবসময় পরিচ্ছন্ন না"]	\N	{}	\N	\N	\N	2025-08-27 21:05:36.883307+00	2025-09-02 21:21:27.899441+00
20	1	27	\N	Stanford Excellence	Stanford University provides an excellent balance of academic rigor and innovation. The Silicon Valley location is a huge advantage.	5	f	f	33	0	0	\N	["Great location", "Innovation focus", "Strong tech connections"]	["High cost of living", "Competitive admission"]	\N	{}	\N	\N	\N	2025-08-24 20:59:25.711306+00	2025-08-24 20:59:25.711306+00
6	1	28	\N	Great Place to Work	Google offers excellent benefits and a collaborative work environment. The projects are challenging and meaningful.	4	f	t	5	7	2	\N	["Excellent benefits", "Collaborative culture", "Challenging projects"]	["Long hours sometimes", "High performance expectations"]	\N	{"bomb": 2, "love": 3, "thumbs_up": 2}	{"name": "Google LLC", "avatar": null, "entity_id": 28, "is_claimed": null, "view_count": 0, "description": "Multinational technology company specializing in Internet-related services", "is_verified": true, "review_count": 1, "root_category": {"id": 2, "name": "Companies/Institutes", "slug": "companies-institutes"}, "average_rating": 4, "final_category": {"id": 16, "name": "Technology Companies", "slug": "technology-companies"}}	{"name": "raja", "level": 1, "avatar": null, "user_id": 1, "username": "raja", "is_verified": true}	\N	2025-08-24 18:40:27.7571+00	2025-09-02 20:37:11.728454+00
22	4	28	\N	Innovation at Its Best	Working at Google has been an amazing experience. The company truly values innovation and employee growth.	5	f	f	22	0	0	\N	["Innovation focus", "Employee growth", "Amazing perks"]	["Can be overwhelming for new grads"]	\N	{}	\N	\N	\N	2025-08-30 20:59:25.711306+00	2025-08-30 20:59:25.711306+00
23	1	29	\N	Design Excellence	Apple's attention to detail and design excellence is unmatched. Working here has elevated my design skills significantly.	4	f	f	35	0	0	\N	["Design focus", "Quality products", "Strong brand"]	["Very secretive culture", "Limited work-life balance"]	\N	{}	\N	\N	\N	2025-08-29 20:59:25.711306+00	2025-08-29 20:59:25.711306+00
24	2	30	\N	Exceptional Healthcare	The care I received at Mayo Clinic was exceptional. The doctors are knowledgeable and the facilities are top-notch.	5	f	f	28	0	0	\N	["Expert doctors", "State-of-art facilities", "Comprehensive care"]	["Can be expensive", "Long wait times for appointments"]	\N	{}	\N	\N	\N	2025-08-27 20:59:25.711306+00	2025-08-27 20:59:25.711306+00
25	4	31	\N	Culinary Masterpiece	The French Laundry is truly a culinary masterpiece. Every dish was perfectly executed and the service was flawless.	5	f	f	29	0	0	\N	["Perfect execution", "Flawless service", "Unique experience"]	["Extremely expensive", "Hard to get reservations"]	\N	{}	\N	\N	\N	2025-08-21 20:59:25.711306+00	2025-08-21 20:59:25.711306+00
27	4	32	\N	Premium But Worth It	While expensive, the iPhone 15 Pro delivers on all fronts. The build quality and software experience are unmatched.	4	f	f	38	0	0	\N	["Premium build quality", "Smooth software", "Great ecosystem"]	["High price", "No USB-C to Lightning adapter included"]	\N	{}	\N	\N	\N	2025-08-25 20:59:25.711306+00	2025-08-25 20:59:25.711306+00
30	3	29	\N	Apple Corporate Culture	Working at Apple taught me the importance of attention to detail. The corporate culture is unique but can be demanding.	3.5	f	f	41	0	0	\N	["Attention to detail", "Quality focus", "Brand prestige"]	["Demanding culture", "Long hours", "High pressure"]	\N	{}	\N	\N	\N	2025-08-22 20:59:25.711306+00	2025-08-22 20:59:25.711306+00
31	4	30	\N	World-Class Medical Care	Mayo Clinic provided comprehensive care for my complex medical condition. The coordination between specialists was impressive.	4.8	f	f	33	0	0	\N	["Comprehensive care", "Expert specialists", "Great coordination"]	["Expensive", "Long appointment wait times"]	\N	{}	\N	\N	\N	2025-08-25 20:59:25.711306+00	2025-08-25 20:59:25.711306+00
32	1	28	\N	Google Work Environment	Google provides an amazing work environment with great perks. The technical challenges keep you constantly learning.	4.5	f	f	27	0	0	\N	["Great perks", "Technical challenges", "Learning opportunities"]	["Fast-paced", "High expectations"]	\N	{}	\N	\N	\N	2025-08-20 20:59:25.711306+00	2025-08-20 20:59:25.711306+00
33	2	32	\N	iPhone Camera Excellence	The iPhone 15 Pro camera system is simply the best I've used. The computational photography features are incredible.	5	f	f	39	0	0	\N	["Best camera system", "Computational photography", "Video quality"]	["Expensive storage upgrades"]	\N	{}	\N	\N	\N	2025-08-29 20:59:25.711306+00	2025-08-29 20:59:25.711306+00
34	3	33	\N	M3 Chip Performance	The M3 chip in this MacBook Pro is a game-changer for video editing and development work. Battery life is outstanding.	4.7	f	f	44	0	0	\N	["M3 chip performance", "Battery life", "Build quality"]	["Price point", "Limited upgradeability"]	\N	{}	\N	\N	\N	2025-08-23 20:59:25.711306+00	2025-08-23 20:59:25.711306+00
35	4	31	\N	Michelin Star Experience	The French Laundry truly deserves its Michelin stars. Every course was a work of art and the service was impeccable.	4.9	f	f	22	0	0	\N	["Michelin star quality", "Artistic presentation", "Impeccable service"]	["Extremely expensive", "Months-long waiting list"]	\N	{}	\N	\N	\N	2025-08-19 20:59:25.711306+00	2025-08-19 20:59:25.711306+00
44	1	36	\N	NSU এর শিক্ষা ব্যবস্থা	নর্থ সাউথ ইউনিভার্সিটিতে পড়াশোনার পরিবেশ খুব ভালো। শিক্ষকরা সহযোগিতামূলক। তবে টিউশন ফি অনেক বেশি।	4.2	f	f	29	0	0	\N	["ভালো শিক্ষা পরিবেশ", "সহযোগী শিক্ষক", "আধুনিক ক্যাম্পাস"]	["টিউশন ফি বেশি", "পার্কিং সমস্যা"]	\N	{}	\N	\N	\N	2025-08-24 21:05:36.883307+00	2025-08-24 21:05:36.883307+00
29	2	27	\N	Great Research Opportunities	Stanford offers incredible research opportunities and the faculty mentorship is outstanding. Perfect place for aspiring researchers.	4.5	f	f	1	0	0	\N	["Research opportunities", "Faculty mentorship", "Silicon Valley connections"]	["High cost of living", "Intense competition"]	\N	{}	\N	\N	\N	2025-08-27 20:59:25.711306+00	2025-09-02 21:21:31.695578+00
21	3	28	\N	Great Place to Work	Google offers excellent benefits and a collaborative work environment. The projects are challenging and meaningful.	4	f	f	1	0	0	\N	["Excellent benefits", "Collaborative culture", "Challenging projects"]	["Long hours sometimes", "High performance expectations"]	\N	{}	\N	\N	\N	2025-09-01 20:59:25.711306+00	2025-09-02 21:22:03.294604+00
26	3	32	\N	Outstanding Smartphone	The iPhone 15 Pro is an incredible device with amazing camera quality and performance. Battery life is excellent.	5	f	f	1	0	0	\N	["Amazing camera", "Excellent performance", "Great battery life"]	["Expensive", "No major design changes"]	\N	{}	\N	\N	\N	2025-08-26 20:59:25.711306+00	2025-09-02 21:22:08.25317+00
28	1	33	\N	MacBook Pro Performance	The MacBook Pro M3 is a powerhouse for professional work. The battery life and performance are impressive.	5	f	f	1	0	0	\N	["Excellent performance", "Great battery life", "Beautiful display"]	["Expensive", "Limited ports"]	\N	{}	\N	\N	\N	2025-08-18 20:59:25.711306+00	2025-09-02 21:22:15.582231+00
45	2	44	\N	বিরিয়ানির রাজা	ফখরুদ্দিনের বিরিয়ানি সত্যিই দারুণ। মাংস নরম, চালের গন্ধ মুখে লাগে। দাম তুলনামূলক কম। পারিবারিক পরিবেশ।	4	f	f	35	0	0	\N	["স্বাদ চমৎকার", "দাম সাশ্রয়ী", "পারিবারিক পরিবেশ"]	["কখনো কখনো অপেক্ষা বেশি", "ডেলিভারি দেরি"]	\N	{}	\N	\N	\N	2025-08-22 21:05:36.883307+00	2025-08-22 21:05:36.883307+00
39	4	38	\N	সেবার মান ভালো	গ্রামীণফোনের নেটওয়ার্ক কভারেজ দেশের সব জায়গায় পাওয়া যায়। কাস্টমার সার্ভিস ঠিক আছে। তবে প্যাকেজ একটু দামী।	3.8	f	f	1	0	0	\N	["সারাদেশে নেটওয়ার্ক", "ভালো ইন্টারনেট স্পিড", "বিশ্বস্ত সেবা"]	["প্যাকেজ দামী", "অটো রিনিউ সমস্যা", "বিল বেশি"]	\N	{}	\N	\N	\N	2025-08-31 21:05:36.883307+00	2025-09-02 21:09:15.306259+00
18	1	26	\N	Excellent Academic Experience	Harvard provided me with an outstanding education and opened many doors for my career. The faculty is world-class and the resources are unmatched.	5	f	f	1	0	0	\N	["World-class faculty", "Excellent resources", "Great networking opportunities"]	["Very expensive", "Highly competitive environment"]	\N	{}	\N	\N	\N	2025-08-31 20:59:25.711306+00	2025-09-02 21:09:21.779373+00
36	1	34	\N	DU তে পড়ার অভিজ্ঞতা	ঢাকা বিশ্ববিদ্যালয়ে পড়া একটা গর্বের বিষয়। শিক্ষকরা খুবই দক্ষ এবং লাইব্রেরি সুবিধা ভালো। তবে ভর্তি প্রতিযোগিতা অনেক কঠিন।	4	f	f	1	0	0	\N	["দক্ষ শিক্ষকমন্ডলী", "ভালো লাইব্রেরি", "ঐতিহ্যবাহী প্রতিষ্ঠান", "গবেষণার সুবিধা"]	["ভর্তি প্রতিযোগিতা কঠিন", "ক্যাম্পাস জায়গা কম", "আবাসিক হল সংকট"]	\N	{}	\N	\N	\N	2025-08-30 21:05:36.883307+00	2025-09-02 21:09:23.938135+00
19	2	26	\N	Challenging but Rewarding	The academic rigor at Harvard is intense, but it really prepares you for the real world. The alumni network is incredible.	4	f	f	1	0	0	\N	["Strong alumni network", "Rigorous academics", "Beautiful campus"]	["High stress environment", "Limited financial aid"]	\N	{}	\N	\N	\N	2025-08-28 20:59:25.711306+00	2025-09-02 21:21:27.457211+00
\.


--
-- TOC entry 4266 (class 0 OID 17422)
-- Dependencies: 311
-- Data for Name: review_reactions; Type: TABLE DATA; Schema: public; Owner: reviewinn_user
--

COPY public.review_reactions (reaction_id, review_id, user_id, reaction_type, created_at, updated_at) FROM stdin;
2	6	1	love	2025-08-25 20:59:36.456162+00	2025-08-25 20:59:36.456162+00
4	5	1	thumbs_up	2025-08-25 22:17:34.850813+00	2025-08-25 22:17:34.850813+00
3	5	2	haha	2025-08-25 21:27:42.893289+00	2025-08-26 06:48:04.311635+00
5	7	2	love	2025-08-25 22:20:16.588627+00	2025-08-26 08:55:23.586969+00
6	6	7	thumbs_up	2025-08-31 20:57:41.149573+00	2025-08-31 20:57:41.149573+00
7	5	7	love	2025-08-31 20:57:45.746103+00	2025-08-31 20:57:45.746103+00
1	6	2	bomb	2025-08-25 20:54:00.698512+00	2025-09-01 04:54:01.21491+00
8	5	11	celebration	2025-09-01 16:42:26.551449+00	2025-09-01 16:47:02.979014+00
10	6	15	love	2025-09-01 18:09:52.563979+00	2025-09-01 18:09:52.563979+00
11	5	14	love	2025-09-01 19:48:39.328929+00	2025-09-01 19:48:39.328929+00
9	6	14	thumbs_up	2025-09-01 17:53:34.714193+00	2025-09-01 19:58:19.561958+00
12	6	17	love	2025-09-02 16:46:50.098925+00	2025-09-02 16:46:50.098925+00
13	7	17	bomb	2025-09-02 16:47:26.557927+00	2025-09-02 16:47:26.557927+00
14	6	18	bomb	2025-09-02 20:00:22.845054+00	2025-09-02 20:00:22.845054+00
15	5	18	haha	2025-09-02 20:37:41.01935+00	2025-09-02 20:37:41.01935+00
\.


--
-- TOC entry 4219 (class 0 OID 16888)
-- Dependencies: 264
-- Data for Name: review_templates; Type: TABLE DATA; Schema: public; Owner: reviewinn_user
--

COPY public.review_templates (template_id, name, unified_category_id, template_data, is_public, created_by, usage_count, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 4268 (class 0 OID 17442)
-- Dependencies: 313
-- Data for Name: review_versions; Type: TABLE DATA; Schema: public; Owner: reviewinn_user
--

COPY public.review_versions (version_id, review_id, user_id, rating, comment, updated_at) FROM stdin;
\.


--
-- TOC entry 4270 (class 0 OID 17463)
-- Dependencies: 315
-- Data for Name: review_views; Type: TABLE DATA; Schema: public; Owner: reviewinn_user
--

COPY public.review_views (view_id, review_id, user_id, ip_address, user_agent, session_id, viewed_at, expires_at, is_valid, is_unique_user, is_unique_session) FROM stdin;
1	7	\N	172.19.0.1	curl/7.81.0	cdd8a38121323bea5f346d84c5179bba	2025-08-25 21:34:23.244798+00	2025-08-25 22:34:23.248367+00	t	f	t
2	6	2	172.19.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	feb7941a115abbec903429460563f1c6	2025-08-25 21:38:55.845524+00	2025-08-26 21:38:55.866734+00	t	t	t
3	5	\N	172.19.0.1	curl/7.81.0	cdd8a38121323bea5f346d84c5179bba	2025-08-25 21:40:32.562405+00	2025-08-25 22:40:32.566128+00	t	f	t
4	5	\N	192.168.1.5	python-requests/2.31.0	72c6e81f995c5bd4d477c3485e84b5e2	2025-08-25 21:43:35.895333+00	2025-08-25 22:43:35.896727+00	t	f	t
5	6	\N	192.168.1.6	python-requests/2.31.0	206977da7203889d16a377d05248315b	2025-08-25 21:43:38.941631+00	2025-08-25 22:43:38.943623+00	t	f	t
6	7	\N	192.168.1.7	python-requests/2.31.0	a7069d8125466bfe7c89b782e3c8ad5a	2025-08-25 21:43:41.990905+00	2025-08-25 22:43:41.993045+00	t	f	t
7	7	1	192.168.1.100	\N	\N	2025-08-25 22:20:21.423292+00	\N	t	\N	\N
8	6	\N	172.19.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2a3792936e89a51753a1b52c2b765845	2025-08-26 00:50:27.088849+00	2025-08-26 01:50:27.09574+00	t	f	t
9	6	\N	172.19.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	c527431b9620310deb788cf71c913078	2025-08-26 04:27:11.965366+00	2025-08-26 05:27:11.972303+00	t	f	t
10	5	\N	172.19.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	c527431b9620310deb788cf71c913078	2025-08-26 04:27:13.887608+00	2025-08-26 05:27:13.8931+00	t	f	t
11	5	2	172.19.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	98a309b773ae73a1dbdf3c68ef89e4fe	2025-08-26 06:47:11.092771+00	2025-08-27 06:47:11.114267+00	t	t	t
12	7	2	172.19.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	98a309b773ae73a1dbdf3c68ef89e4fe	2025-08-26 06:47:20.635158+00	2025-08-27 06:47:20.645675+00	t	t	t
13	6	\N	172.19.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	11f405a949732bb683f3dc84cff2e241	2025-08-26 07:30:02.321375+00	2025-08-26 08:30:02.325532+00	t	f	t
14	6	\N	172.19.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	038b1963a3c2f513c3617fbf36f5b2c5	2025-08-30 04:20:36.940557+00	2025-08-30 05:20:37.045534+00	t	f	t
15	5	2	172.19.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	3bc2534ddbbfb9c7521b96ffee050404	2025-08-31 03:59:19.221335+00	2025-09-01 03:59:19.238138+00	t	f	t
16	6	\N	172.19.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	8487b7d1d3f2d6ebb50d5d75df546b78	2025-08-31 15:15:34.585298+00	2025-08-31 16:15:34.591716+00	t	f	t
17	6	\N	172.19.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2b267ed28caaf34c833e66c438c3f983	2025-08-31 20:07:55.165215+00	2025-08-31 21:07:55.171334+00	t	f	t
18	7	7	172.19.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2b267ed28caaf34c833e66c438c3f983	2025-08-31 20:57:46.701927+00	2025-09-01 20:57:46.722761+00	t	t	t
19	5	2	172.19.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	ae9726558e7525dc48e5a5121d5e81a7	2025-09-01 04:54:01.569061+00	2025-09-02 04:54:01.588542+00	t	f	t
20	6	\N	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	ce77130794db50d0be81f43eff85c9b8	2025-09-01 07:22:07.8494+00	2025-09-01 08:22:07.856002+00	t	f	t
21	6	\N	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	72e1fa0a23c342cda6ee65149a5d6a35	2025-09-01 17:41:20.792036+00	2025-09-01 18:41:20.80016+00	t	f	t
22	7	14	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	72e1fa0a23c342cda6ee65149a5d6a35	2025-09-01 17:42:59.639693+00	2025-09-02 17:42:59.658546+00	t	t	t
23	6	\N	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	de2038047660afd60da0e9d272d9a114	2025-09-01 18:10:18.294504+00	2025-09-01 19:10:18.299882+00	t	f	t
24	5	15	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	de2038047660afd60da0e9d272d9a114	2025-09-01 18:10:41.999599+00	2025-09-02 18:10:42.019878+00	t	t	t
25	6	\N	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	72445214405a2155ccd5dc706c539415	2025-09-01 19:22:22.541479+00	2025-09-01 20:22:22.548403+00	t	f	t
26	5	14	172.18.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	72445214405a2155ccd5dc706c539415	2025-09-01 19:48:37.207689+00	2025-09-02 19:48:37.230838+00	t	t	t
27	7	15	172.18.0.6	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	7d87cb01f0403eb25fd1120d501e143e	2025-09-02 01:14:48.718634+00	2025-09-03 01:14:48.740728+00	t	t	t
28	6	15	172.18.0.6	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	21bd0125192d6dfeffaf998b905733bb	2025-09-02 02:09:14.087111+00	2025-09-03 02:09:14.10338+00	t	t	t
29	6	14	172.18.0.6	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	21bd0125192d6dfeffaf998b905733bb	2025-09-02 02:25:09.555347+00	2025-09-03 02:25:09.574692+00	t	t	f
30	6	\N	172.18.0.6	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	c56c8e66a56a67fc18e1042948048fff	2025-09-02 16:46:18.374942+00	2025-09-02 17:46:18.383627+00	t	f	t
31	6	17	172.18.0.6	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	c56c8e66a56a67fc18e1042948048fff	2025-09-02 16:46:53.326828+00	2025-09-03 16:46:53.345647+00	t	t	f
32	5	17	172.18.0.6	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	c56c8e66a56a67fc18e1042948048fff	2025-09-02 16:47:01.602522+00	2025-09-03 16:47:01.611078+00	t	t	t
33	7	17	172.18.0.6	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	c56c8e66a56a67fc18e1042948048fff	2025-09-02 16:47:26.149299+00	2025-09-03 16:47:26.156617+00	t	t	t
34	6	\N	172.18.0.6	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	08e1544f53cf08fbe93e423c868d9ef7	2025-09-02 19:51:27.396356+00	2025-09-02 20:51:27.399619+00	t	f	t
35	6	\N	172.18.0.6	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	a46de7e7314392298136951db3ec3ffb	2025-09-02 20:37:11.728454+00	2025-09-02 21:37:11.731602+00	t	f	t
36	5	18	172.18.0.6	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	a46de7e7314392298136951db3ec3ffb	2025-09-02 20:37:37.840612+00	2025-09-03 20:37:37.858248+00	t	t	t
37	7	18	172.18.0.6	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	a46de7e7314392298136951db3ec3ffb	2025-09-02 20:37:41.091836+00	2025-09-03 20:37:41.099117+00	t	t	t
38	39	\N	172.18.0.6	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	6bfefc9e8f703f0ac0bc6abda479cbfa	2025-09-02 21:09:15.306259+00	2025-09-02 22:09:15.309466+00	t	f	t
39	18	\N	172.18.0.6	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	6bfefc9e8f703f0ac0bc6abda479cbfa	2025-09-02 21:09:21.779373+00	2025-09-02 22:09:21.782378+00	t	f	t
40	36	\N	172.18.0.6	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	6bfefc9e8f703f0ac0bc6abda479cbfa	2025-09-02 21:09:23.938135+00	2025-09-02 22:09:23.940778+00	t	f	t
41	38	\N	172.18.0.6	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	6bfefc9e8f703f0ac0bc6abda479cbfa	2025-09-02 21:09:41.615535+00	2025-09-02 22:09:41.616739+00	t	f	t
42	19	\N	172.18.0.6	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	6bfefc9e8f703f0ac0bc6abda479cbfa	2025-09-02 21:21:27.457211+00	2025-09-02 22:21:27.458702+00	t	f	t
43	42	\N	172.18.0.6	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	6bfefc9e8f703f0ac0bc6abda479cbfa	2025-09-02 21:21:27.899441+00	2025-09-02 22:21:27.901228+00	t	f	t
44	29	\N	172.18.0.6	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	6bfefc9e8f703f0ac0bc6abda479cbfa	2025-09-02 21:21:31.695578+00	2025-09-02 22:21:31.697418+00	t	f	t
45	21	18	172.18.0.6	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	6bfefc9e8f703f0ac0bc6abda479cbfa	2025-09-02 21:22:03.294604+00	2025-09-03 21:22:03.302988+00	t	t	t
46	26	18	172.18.0.6	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	6bfefc9e8f703f0ac0bc6abda479cbfa	2025-09-02 21:22:08.25317+00	2025-09-03 21:22:08.261181+00	t	t	t
47	28	18	172.18.0.6	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	6bfefc9e8f703f0ac0bc6abda479cbfa	2025-09-02 21:22:15.582231+00	2025-09-03 21:22:15.588633+00	t	t	t
\.


--
-- TOC entry 4254 (class 0 OID 17269)
-- Dependencies: 299
-- Data for Name: search_analytics; Type: TABLE DATA; Schema: public; Owner: reviewinn_user
--

COPY public.search_analytics (search_id, user_id, query, results_count, clicked_entity_id, search_date, filters) FROM stdin;
\.


--
-- TOC entry 4223 (class 0 OID 16926)
-- Dependencies: 268
-- Data for Name: social_circle_blocks; Type: TABLE DATA; Schema: public; Owner: reviewinn_user
--

COPY public.social_circle_blocks (block_id, blocker_id, blocked_user_id, block_reason, block_type, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 4225 (class 0 OID 16950)
-- Dependencies: 270
-- Data for Name: social_circle_members; Type: TABLE DATA; Schema: public; Owner: reviewinn_user
--

COPY public.social_circle_members (circle_id, owner_id, member_id, membership_type, joined_at, can_see_private_reviews, notification_preferences, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 4227 (class 0 OID 16978)
-- Dependencies: 272
-- Data for Name: social_circle_requests; Type: TABLE DATA; Schema: public; Owner: reviewinn_user
--

COPY public.social_circle_requests (request_id, requester_id, recipient_id, request_message, request_type, status, response_type, response_message, requested_at, responded_at, expires_at, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 4179 (class 0 OID 16483)
-- Dependencies: 224
-- Data for Name: unified_categories; Type: TABLE DATA; Schema: public; Owner: reviewinn_user
--

COPY public.unified_categories (id, name, slug, description, parent_id, path, level, icon, color, is_active, sort_order, extra_data, created_at, updated_at) FROM stdin;
1	Professionals	professionals	Individual professionals across various fields	\N	\N	1	\N	\N	t	1	\N	2025-08-25 18:40:27.7571+00	2025-08-25 18:40:27.7571+00
2	Companies/Institutes	companies-institutes	Organizations, companies, and institutions	\N	\N	1	\N	\N	t	2	\N	2025-08-25 18:40:27.7571+00	2025-08-25 18:40:27.7571+00
3	Places	places	Physical locations and venues	\N	\N	1	\N	\N	t	3	\N	2025-08-25 18:40:27.7571+00	2025-08-25 18:40:27.7571+00
4	Products	products	Goods and products across various categories	\N	\N	1	\N	\N	t	4	\N	2025-08-25 18:40:27.7571+00	2025-08-25 18:40:27.7571+00
5	Other	other	Other miscellaneous categories	\N	\N	1	\N	\N	t	5	\N	2025-08-25 18:40:27.7571+00	2025-08-25 18:40:27.7571+00
6	Education	education	Education professionals	1	\N	2	\N	\N	t	1	\N	2025-08-25 18:40:27.7571+00	2025-08-25 18:40:27.7571+00
7	Healthcare	healthcare	Healthcare professionals	1	\N	2	\N	\N	t	2	\N	2025-08-25 18:40:27.7571+00	2025-08-25 18:40:27.7571+00
8	Legal	legal	Legal professionals	1	\N	2	\N	\N	t	3	\N	2025-08-25 18:40:27.7571+00	2025-08-25 18:40:27.7571+00
9	Engineering	engineering	Engineering professionals	1	\N	2	\N	\N	t	4	\N	2025-08-25 18:40:27.7571+00	2025-08-25 18:40:27.7571+00
10	Information Technology	information-technology	IT professionals	1	\N	2	\N	\N	t	5	\N	2025-08-25 18:40:27.7571+00	2025-08-25 18:40:27.7571+00
11	Business	business	Business professionals	1	\N	2	\N	\N	t	6	\N	2025-08-25 18:40:27.7571+00	2025-08-25 18:40:27.7571+00
12	Finance	finance	Finance professionals	1	\N	2	\N	\N	t	7	\N	2025-08-25 18:40:27.7571+00	2025-08-25 18:40:27.7571+00
13	Creative Arts	creative-arts	Creative professionals	1	\N	2	\N	\N	t	8	\N	2025-08-25 18:40:27.7571+00	2025-08-25 18:40:27.7571+00
14	Media	media	Media professionals	1	\N	2	\N	\N	t	9	\N	2025-08-25 18:40:27.7571+00	2025-08-25 18:40:27.7571+00
15	Public Services	public-services	Public service professionals	1	\N	2	\N	\N	t	10	\N	2025-08-25 18:40:27.7571+00	2025-08-25 18:40:27.7571+00
16	Hospitality	hospitality-prof	Hospitality professionals	1	\N	2	\N	\N	t	11	\N	2025-08-25 18:40:27.7571+00	2025-08-25 18:40:27.7571+00
17	Skilled Trades	skilled-trades	Skilled trade professionals	1	\N	2	\N	\N	t	12	\N	2025-08-25 18:40:27.7571+00	2025-08-25 18:40:27.7571+00
18	Other Professionals	other-professionals	Other professionals	1	\N	2	\N	\N	t	13	\N	2025-08-25 18:40:27.7571+00	2025-08-25 18:40:27.7571+00
19	Education Institutes	education-institutes	Educational institutions	2	\N	2	\N	\N	t	1	\N	2025-08-25 18:40:27.7571+00	2025-08-25 18:40:27.7571+00
20	Technology Companies	technology-companies	Technology companies	2	\N	2	\N	\N	t	2	\N	2025-08-25 18:40:27.7571+00	2025-08-25 18:40:27.7571+00
21	Manufacturing	manufacturing	Manufacturing companies	2	\N	2	\N	\N	t	3	\N	2025-08-25 18:40:27.7571+00	2025-08-25 18:40:27.7571+00
22	Retail Companies	retail-companies	Retail companies	2	\N	2	\N	\N	t	4	\N	2025-08-25 18:40:27.7571+00	2025-08-25 18:40:27.7571+00
23	Healthcare Institutes	healthcare-institutes	Healthcare institutions	2	\N	2	\N	\N	t	5	\N	2025-08-25 18:40:27.7571+00	2025-08-25 18:40:27.7571+00
24	Finance Companies	finance-companies	Financial institutions	2	\N	2	\N	\N	t	6	\N	2025-08-25 18:40:27.7571+00	2025-08-25 18:40:27.7571+00
25	Government Agencies	government-agencies	Government organizations	2	\N	2	\N	\N	t	7	\N	2025-08-25 18:40:27.7571+00	2025-08-25 18:40:27.7571+00
26	Non-Profits	non-profits	Non-profit organizations	2	\N	2	\N	\N	t	8	\N	2025-08-25 18:40:27.7571+00	2025-08-25 18:40:27.7571+00
27	Other Companies	other-companies	Other companies	2	\N	2	\N	\N	t	9	\N	2025-08-25 18:40:27.7571+00	2025-08-25 18:40:27.7571+00
28	Hospitality Places	hospitality-places	Hotels, restaurants, cafes	3	\N	2	\N	\N	t	1	\N	2025-08-25 18:40:27.7571+00	2025-08-25 18:40:27.7571+00
29	Tourism	tourism	Tourist attractions and sites	3	\N	2	\N	\N	t	2	\N	2025-08-25 18:40:27.7571+00	2025-08-25 18:40:27.7571+00
30	Public Services Places	public-services-places	Public service locations	3	\N	2	\N	\N	t	3	\N	2025-08-25 18:40:27.7571+00	2025-08-25 18:40:27.7571+00
31	Retail Places	retail-places	Shopping and retail locations	3	\N	2	\N	\N	t	4	\N	2025-08-25 18:40:27.7571+00	2025-08-25 18:40:27.7571+00
32	Recreation	recreation	Recreation and entertainment venues	3	\N	2	\N	\N	t	5	\N	2025-08-25 18:40:27.7571+00	2025-08-25 18:40:27.7571+00
33	Other Places	other-places	Other types of places	3	\N	2	\N	\N	t	6	\N	2025-08-25 18:40:27.7571+00	2025-08-25 18:40:27.7571+00
34	Electronics	electronics	Electronic products	4	\N	2	\N	\N	t	1	\N	2025-08-25 18:40:27.7571+00	2025-08-25 18:40:27.7571+00
35	Fashion	fashion	Fashion and clothing	4	\N	2	\N	\N	t	2	\N	2025-08-25 18:40:27.7571+00	2025-08-25 18:40:27.7571+00
36	Food & Beverages	food-beverages	Food and beverage products	4	\N	2	\N	\N	t	3	\N	2025-08-25 18:40:27.7571+00	2025-08-25 18:40:27.7571+00
37	Home & Kitchen	home-kitchen	Home and kitchen products	4	\N	2	\N	\N	t	4	\N	2025-08-25 18:40:27.7571+00	2025-08-25 18:40:27.7571+00
38	Health & Beauty	health-beauty	Health and beauty products	4	\N	2	\N	\N	t	5	\N	2025-08-25 18:40:27.7571+00	2025-08-25 18:40:27.7571+00
39	Automotive	automotive	Automotive products	4	\N	2	\N	\N	t	6	\N	2025-08-25 18:40:27.7571+00	2025-08-25 18:40:27.7571+00
40	Sports & Outdoors	sports-outdoors	Sports and outdoor products	4	\N	2	\N	\N	t	7	\N	2025-08-25 18:40:27.7571+00	2025-08-25 18:40:27.7571+00
41	Other Products	other-products	Other products	4	\N	2	\N	\N	t	8	\N	2025-08-25 18:40:27.7571+00	2025-08-25 18:40:27.7571+00
42	Custom	custom	Custom categories	5	\N	2	\N	\N	t	1	\N	2025-08-25 18:40:27.7571+00	2025-08-25 18:40:27.7571+00
\.


--
-- TOC entry 4187 (class 0 OID 16557)
-- Dependencies: 232
-- Data for Name: user_badges; Type: TABLE DATA; Schema: public; Owner: reviewinn_user
--

COPY public.user_badges (user_id, badge_id, awarded_at) FROM stdin;
\.


--
-- TOC entry 4201 (class 0 OID 16725)
-- Dependencies: 246
-- Data for Name: user_connections; Type: TABLE DATA; Schema: public; Owner: reviewinn_user
--

COPY public.user_connections (user_id, target_user_id, connection_type, status, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 4252 (class 0 OID 17249)
-- Dependencies: 297
-- Data for Name: user_entity_views; Type: TABLE DATA; Schema: public; Owner: reviewinn_user
--

COPY public.user_entity_views (view_id, user_id, entity_id, viewed_at, updated_at) FROM stdin;
\.


--
-- TOC entry 4206 (class 0 OID 16777)
-- Dependencies: 251
-- Data for Name: user_events; Type: TABLE DATA; Schema: public; Owner: reviewinn_user
--

COPY public.user_events (event_id, user_id, event_type, event_data, occurred_at, updated_at) FROM stdin;
\.


--
-- TOC entry 4200 (class 0 OID 16713)
-- Dependencies: 245
-- Data for Name: user_profiles; Type: TABLE DATA; Schema: public; Owner: reviewinn_user
--

COPY public.user_profiles (user_id, bio, first_name, last_name, avatar, location, website, created_at) FROM stdin;
\.


--
-- TOC entry 4209 (class 0 OID 16810)
-- Dependencies: 254
-- Data for Name: user_progress; Type: TABLE DATA; Schema: public; Owner: reviewinn_user
--

COPY public.user_progress (user_id, points, level, progress_to_next_level, daily_streak, last_reviewed, published_reviews, review_target, total_helpful_votes, average_rating_given, entities_reviewed, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 4208 (class 0 OID 16794)
-- Dependencies: 253
-- Data for Name: user_search_history; Type: TABLE DATA; Schema: public; Owner: reviewinn_user
--

COPY public.user_search_history (search_id, user_id, query, matched_entity_ids, searched_at, updated_at) FROM stdin;
\.


--
-- TOC entry 4203 (class 0 OID 16743)
-- Dependencies: 248
-- Data for Name: user_sessions; Type: TABLE DATA; Schema: public; Owner: reviewinn_user
--

COPY public.user_sessions (session_id, user_id, token_hash, created_at, expires_at, last_accessed, device_info, is_valid, updated_at) FROM stdin;
\.


--
-- TOC entry 4204 (class 0 OID 16762)
-- Dependencies: 249
-- Data for Name: user_settings; Type: TABLE DATA; Schema: public; Owner: reviewinn_user
--

COPY public.user_settings (user_id, privacy_settings, notification_settings, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 4183 (class 0 OID 16516)
-- Dependencies: 228
-- Data for Name: view_analytics; Type: TABLE DATA; Schema: public; Owner: reviewinn_user
--

COPY public.view_analytics (analytics_id, content_type, content_id, total_views, unique_users, unique_sessions, valid_views, views_today, views_this_week, views_this_month, last_updated, last_view_at) FROM stdin;
4	entity	30	1	1	0	1	0	0	0	2025-09-02 01:34:16.408356+00	2025-09-02 01:34:16.421785+00
5	entity	26	1	1	0	1	0	0	0	2025-09-02 02:08:14.860483+00	2025-09-02 02:08:14.879333+00
1	review	6	4	4	2	4	4	4	4	2025-09-02 16:46:53.326828+00	2025-09-02 16:46:53.353346+00
2	review	5	7	5	7	7	7	7	7	2025-09-02 20:37:37.840612+00	2025-09-02 20:37:37.865912+00
3	review	7	6	6	6	6	6	6	6	2025-09-02 20:37:41.091836+00	2025-09-02 20:37:41.103359+00
6	review	21	1	1	1	1	1	1	1	2025-09-02 21:22:03.294604+00	2025-09-02 21:22:03.309645+00
7	review	26	1	1	1	1	1	1	1	2025-09-02 21:22:08.25317+00	2025-09-02 21:22:08.266466+00
8	review	28	1	1	1	1	1	1	1	2025-09-02 21:22:15.582231+00	2025-09-02 21:22:15.592394+00
\.


--
-- TOC entry 4213 (class 0 OID 16843)
-- Dependencies: 258
-- Data for Name: weekly_engagement; Type: TABLE DATA; Schema: public; Owner: reviewinn_user
--

COPY public.weekly_engagement (engagement_id, user_id, engagement_date, reviews, reactions, comments, reports, forwards, points, streak_broken, weekly_rank, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 4217 (class 0 OID 16873)
-- Dependencies: 262
-- Data for Name: whats_next_goals; Type: TABLE DATA; Schema: public; Owner: reviewinn_user
--

COPY public.whats_next_goals (goal_id, user_id, description, target_type, target_value, reward, is_completed, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 4326 (class 0 OID 0)
-- Dependencies: 255
-- Name: badge_awards_award_id_seq; Type: SEQUENCE SET; Schema: public; Owner: reviewinn_user
--

SELECT pg_catalog.setval('public.badge_awards_award_id_seq', 1, false);


--
-- TOC entry 4327 (class 0 OID 0)
-- Dependencies: 225
-- Name: badge_definitions_badge_definition_id_seq; Type: SEQUENCE SET; Schema: public; Owner: reviewinn_user
--

SELECT pg_catalog.setval('public.badge_definitions_badge_definition_id_seq', 1, false);


--
-- TOC entry 4328 (class 0 OID 0)
-- Dependencies: 219
-- Name: badges_badge_id_seq; Type: SEQUENCE SET; Schema: public; Owner: reviewinn_user
--

SELECT pg_catalog.setval('public.badges_badge_id_seq', 1, false);


--
-- TOC entry 4329 (class 0 OID 0)
-- Dependencies: 273
-- Name: category_questions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: reviewinn_user
--

SELECT pg_catalog.setval('public.category_questions_id_seq', 1, true);


--
-- TOC entry 4330 (class 0 OID 0)
-- Dependencies: 233
-- Name: core_entities_entity_id_seq; Type: SEQUENCE SET; Schema: public; Owner: reviewinn_user
--

SELECT pg_catalog.setval('public.core_entities_entity_id_seq', 52, true);


--
-- TOC entry 4331 (class 0 OID 0)
-- Dependencies: 235
-- Name: core_notifications_notification_id_seq; Type: SEQUENCE SET; Schema: public; Owner: reviewinn_user
--

SELECT pg_catalog.setval('public.core_notifications_notification_id_seq', 42, true);


--
-- TOC entry 4332 (class 0 OID 0)
-- Dependencies: 217
-- Name: core_users_user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: reviewinn_user
--

SELECT pg_catalog.setval('public.core_users_user_id_seq', 18, true);


--
-- TOC entry 4333 (class 0 OID 0)
-- Dependencies: 259
-- Name: daily_tasks_task_id_seq; Type: SEQUENCE SET; Schema: public; Owner: reviewinn_user
--

SELECT pg_catalog.setval('public.daily_tasks_task_id_seq', 1, false);


--
-- TOC entry 4334 (class 0 OID 0)
-- Dependencies: 265
-- Name: entity_comparisons_comparison_id_seq; Type: SEQUENCE SET; Schema: public; Owner: reviewinn_user
--

SELECT pg_catalog.setval('public.entity_comparisons_comparison_id_seq', 1, false);


--
-- TOC entry 4335 (class 0 OID 0)
-- Dependencies: 294
-- Name: entity_metadata_metadata_id_seq; Type: SEQUENCE SET; Schema: public; Owner: reviewinn_user
--

SELECT pg_catalog.setval('public.entity_metadata_metadata_id_seq', 1, false);


--
-- TOC entry 4336 (class 0 OID 0)
-- Dependencies: 292
-- Name: entity_roles_role_id_seq; Type: SEQUENCE SET; Schema: public; Owner: reviewinn_user
--

SELECT pg_catalog.setval('public.entity_roles_role_id_seq', 1, false);


--
-- TOC entry 4337 (class 0 OID 0)
-- Dependencies: 301
-- Name: entity_views_view_id_seq; Type: SEQUENCE SET; Schema: public; Owner: reviewinn_user
--

SELECT pg_catalog.setval('public.entity_views_view_id_seq', 2, true);


--
-- TOC entry 4338 (class 0 OID 0)
-- Dependencies: 229
-- Name: group_categories_category_id_seq; Type: SEQUENCE SET; Schema: public; Owner: reviewinn_user
--

SELECT pg_catalog.setval('public.group_categories_category_id_seq', 1, false);


--
-- TOC entry 4339 (class 0 OID 0)
-- Dependencies: 305
-- Name: group_invitations_invitation_id_seq; Type: SEQUENCE SET; Schema: public; Owner: reviewinn_user
--

SELECT pg_catalog.setval('public.group_invitations_invitation_id_seq', 1, false);


--
-- TOC entry 4340 (class 0 OID 0)
-- Dependencies: 303
-- Name: group_memberships_membership_id_seq; Type: SEQUENCE SET; Schema: public; Owner: reviewinn_user
--

SELECT pg_catalog.setval('public.group_memberships_membership_id_seq', 1, false);


--
-- TOC entry 4341 (class 0 OID 0)
-- Dependencies: 237
-- Name: msg_conversation_participants_participant_id_seq; Type: SEQUENCE SET; Schema: public; Owner: reviewinn_user
--

SELECT pg_catalog.setval('public.msg_conversation_participants_participant_id_seq', 1, false);


--
-- TOC entry 4342 (class 0 OID 0)
-- Dependencies: 221
-- Name: msg_conversations_conversation_id_seq; Type: SEQUENCE SET; Schema: public; Owner: reviewinn_user
--

SELECT pg_catalog.setval('public.msg_conversations_conversation_id_seq', 1, false);


--
-- TOC entry 4343 (class 0 OID 0)
-- Dependencies: 280
-- Name: msg_message_attachments_attachment_id_seq; Type: SEQUENCE SET; Schema: public; Owner: reviewinn_user
--

SELECT pg_catalog.setval('public.msg_message_attachments_attachment_id_seq', 1, false);


--
-- TOC entry 4344 (class 0 OID 0)
-- Dependencies: 290
-- Name: msg_message_mentions_mention_id_seq; Type: SEQUENCE SET; Schema: public; Owner: reviewinn_user
--

SELECT pg_catalog.setval('public.msg_message_mentions_mention_id_seq', 1, false);


--
-- TOC entry 4345 (class 0 OID 0)
-- Dependencies: 288
-- Name: msg_message_pins_pin_id_seq; Type: SEQUENCE SET; Schema: public; Owner: reviewinn_user
--

SELECT pg_catalog.setval('public.msg_message_pins_pin_id_seq', 1, false);


--
-- TOC entry 4346 (class 0 OID 0)
-- Dependencies: 282
-- Name: msg_message_reactions_reaction_id_seq; Type: SEQUENCE SET; Schema: public; Owner: reviewinn_user
--

SELECT pg_catalog.setval('public.msg_message_reactions_reaction_id_seq', 1, false);


--
-- TOC entry 4347 (class 0 OID 0)
-- Dependencies: 284
-- Name: msg_message_status_status_id_seq; Type: SEQUENCE SET; Schema: public; Owner: reviewinn_user
--

SELECT pg_catalog.setval('public.msg_message_status_status_id_seq', 1, false);


--
-- TOC entry 4348 (class 0 OID 0)
-- Dependencies: 239
-- Name: msg_messages_message_id_seq; Type: SEQUENCE SET; Schema: public; Owner: reviewinn_user
--

SELECT pg_catalog.setval('public.msg_messages_message_id_seq', 1, false);


--
-- TOC entry 4349 (class 0 OID 0)
-- Dependencies: 286
-- Name: msg_threads_thread_id_seq; Type: SEQUENCE SET; Schema: public; Owner: reviewinn_user
--

SELECT pg_catalog.setval('public.msg_threads_thread_id_seq', 1, false);


--
-- TOC entry 4350 (class 0 OID 0)
-- Dependencies: 241
-- Name: msg_typing_indicators_typing_id_seq; Type: SEQUENCE SET; Schema: public; Owner: reviewinn_user
--

SELECT pg_catalog.setval('public.msg_typing_indicators_typing_id_seq', 1, false);


--
-- TOC entry 4351 (class 0 OID 0)
-- Dependencies: 243
-- Name: msg_user_presence_presence_id_seq; Type: SEQUENCE SET; Schema: public; Owner: reviewinn_user
--

SELECT pg_catalog.setval('public.msg_user_presence_presence_id_seq', 1, false);


--
-- TOC entry 4352 (class 0 OID 0)
-- Dependencies: 316
-- Name: review_comment_reactions_reaction_id_seq; Type: SEQUENCE SET; Schema: public; Owner: reviewinn_user
--

SELECT pg_catalog.setval('public.review_comment_reactions_reaction_id_seq', 5, true);


--
-- TOC entry 4353 (class 0 OID 0)
-- Dependencies: 308
-- Name: review_comments_comment_id_seq; Type: SEQUENCE SET; Schema: public; Owner: reviewinn_user
--

SELECT pg_catalog.setval('public.review_comments_comment_id_seq', 12, true);


--
-- TOC entry 4354 (class 0 OID 0)
-- Dependencies: 275
-- Name: review_groups_group_id_seq; Type: SEQUENCE SET; Schema: public; Owner: reviewinn_user
--

SELECT pg_catalog.setval('public.review_groups_group_id_seq', 1, false);


--
-- TOC entry 4355 (class 0 OID 0)
-- Dependencies: 277
-- Name: review_main_review_id_seq; Type: SEQUENCE SET; Schema: public; Owner: reviewinn_user
--

SELECT pg_catalog.setval('public.review_main_review_id_seq', 45, true);


--
-- TOC entry 4356 (class 0 OID 0)
-- Dependencies: 310
-- Name: review_reactions_reaction_id_seq; Type: SEQUENCE SET; Schema: public; Owner: reviewinn_user
--

SELECT pg_catalog.setval('public.review_reactions_reaction_id_seq', 15, true);


--
-- TOC entry 4357 (class 0 OID 0)
-- Dependencies: 263
-- Name: review_templates_template_id_seq; Type: SEQUENCE SET; Schema: public; Owner: reviewinn_user
--

SELECT pg_catalog.setval('public.review_templates_template_id_seq', 1, false);


--
-- TOC entry 4358 (class 0 OID 0)
-- Dependencies: 312
-- Name: review_versions_version_id_seq; Type: SEQUENCE SET; Schema: public; Owner: reviewinn_user
--

SELECT pg_catalog.setval('public.review_versions_version_id_seq', 1, false);


--
-- TOC entry 4359 (class 0 OID 0)
-- Dependencies: 314
-- Name: review_views_view_id_seq; Type: SEQUENCE SET; Schema: public; Owner: reviewinn_user
--

SELECT pg_catalog.setval('public.review_views_view_id_seq', 47, true);


--
-- TOC entry 4360 (class 0 OID 0)
-- Dependencies: 298
-- Name: search_analytics_search_id_seq; Type: SEQUENCE SET; Schema: public; Owner: reviewinn_user
--

SELECT pg_catalog.setval('public.search_analytics_search_id_seq', 1, false);


--
-- TOC entry 4361 (class 0 OID 0)
-- Dependencies: 267
-- Name: social_circle_blocks_block_id_seq; Type: SEQUENCE SET; Schema: public; Owner: reviewinn_user
--

SELECT pg_catalog.setval('public.social_circle_blocks_block_id_seq', 1, false);


--
-- TOC entry 4362 (class 0 OID 0)
-- Dependencies: 269
-- Name: social_circle_members_circle_id_seq; Type: SEQUENCE SET; Schema: public; Owner: reviewinn_user
--

SELECT pg_catalog.setval('public.social_circle_members_circle_id_seq', 1, false);


--
-- TOC entry 4363 (class 0 OID 0)
-- Dependencies: 271
-- Name: social_circle_requests_request_id_seq; Type: SEQUENCE SET; Schema: public; Owner: reviewinn_user
--

SELECT pg_catalog.setval('public.social_circle_requests_request_id_seq', 1, false);


--
-- TOC entry 4364 (class 0 OID 0)
-- Dependencies: 223
-- Name: unified_categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: reviewinn_user
--

SELECT pg_catalog.setval('public.unified_categories_id_seq', 42, true);


--
-- TOC entry 4365 (class 0 OID 0)
-- Dependencies: 296
-- Name: user_entity_views_view_id_seq; Type: SEQUENCE SET; Schema: public; Owner: reviewinn_user
--

SELECT pg_catalog.setval('public.user_entity_views_view_id_seq', 1, false);


--
-- TOC entry 4366 (class 0 OID 0)
-- Dependencies: 250
-- Name: user_events_event_id_seq; Type: SEQUENCE SET; Schema: public; Owner: reviewinn_user
--

SELECT pg_catalog.setval('public.user_events_event_id_seq', 1, false);


--
-- TOC entry 4367 (class 0 OID 0)
-- Dependencies: 252
-- Name: user_search_history_search_id_seq; Type: SEQUENCE SET; Schema: public; Owner: reviewinn_user
--

SELECT pg_catalog.setval('public.user_search_history_search_id_seq', 1, false);


--
-- TOC entry 4368 (class 0 OID 0)
-- Dependencies: 247
-- Name: user_sessions_session_id_seq; Type: SEQUENCE SET; Schema: public; Owner: reviewinn_user
--

SELECT pg_catalog.setval('public.user_sessions_session_id_seq', 1, false);


--
-- TOC entry 4369 (class 0 OID 0)
-- Dependencies: 227
-- Name: view_analytics_analytics_id_seq; Type: SEQUENCE SET; Schema: public; Owner: reviewinn_user
--

SELECT pg_catalog.setval('public.view_analytics_analytics_id_seq', 8, true);


--
-- TOC entry 4370 (class 0 OID 0)
-- Dependencies: 257
-- Name: weekly_engagement_engagement_id_seq; Type: SEQUENCE SET; Schema: public; Owner: reviewinn_user
--

SELECT pg_catalog.setval('public.weekly_engagement_engagement_id_seq', 1, false);


--
-- TOC entry 4371 (class 0 OID 0)
-- Dependencies: 261
-- Name: whats_next_goals_goal_id_seq; Type: SEQUENCE SET; Schema: public; Owner: reviewinn_user
--

SELECT pg_catalog.setval('public.whats_next_goals_goal_id_seq', 1, false);


--
-- TOC entry 3793 (class 2606 OID 16830)
-- Name: badge_awards badge_awards_pkey; Type: CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.badge_awards
    ADD CONSTRAINT badge_awards_pkey PRIMARY KEY (award_id);


--
-- TOC entry 3724 (class 2606 OID 16513)
-- Name: badge_definitions badge_definitions_name_key; Type: CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.badge_definitions
    ADD CONSTRAINT badge_definitions_name_key UNIQUE (name);


--
-- TOC entry 3726 (class 2606 OID 16511)
-- Name: badge_definitions badge_definitions_pkey; Type: CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.badge_definitions
    ADD CONSTRAINT badge_definitions_pkey PRIMARY KEY (badge_definition_id);


--
-- TOC entry 3714 (class 2606 OID 16468)
-- Name: badges badges_pkey; Type: CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.badges
    ADD CONSTRAINT badges_pkey PRIMARY KEY (badge_id);


--
-- TOC entry 3832 (class 2606 OID 17017)
-- Name: category_questions category_questions_category_path_key; Type: CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.category_questions
    ADD CONSTRAINT category_questions_category_path_key UNIQUE (category_path);


--
-- TOC entry 3834 (class 2606 OID 17015)
-- Name: category_questions category_questions_pkey; Type: CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.category_questions
    ADD CONSTRAINT category_questions_pkey PRIMARY KEY (id);


--
-- TOC entry 3741 (class 2606 OID 16582)
-- Name: core_entities core_entities_pkey; Type: CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.core_entities
    ADD CONSTRAINT core_entities_pkey PRIMARY KEY (entity_id);


--
-- TOC entry 3745 (class 2606 OID 16600)
-- Name: core_notifications core_notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.core_notifications
    ADD CONSTRAINT core_notifications_pkey PRIMARY KEY (notification_id);


--
-- TOC entry 3707 (class 2606 OID 16458)
-- Name: core_users core_users_email_key; Type: CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.core_users
    ADD CONSTRAINT core_users_email_key UNIQUE (email);


--
-- TOC entry 3709 (class 2606 OID 16454)
-- Name: core_users core_users_pkey; Type: CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.core_users
    ADD CONSTRAINT core_users_pkey PRIMARY KEY (user_id);


--
-- TOC entry 3711 (class 2606 OID 16456)
-- Name: core_users core_users_username_key; Type: CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.core_users
    ADD CONSTRAINT core_users_username_key UNIQUE (username);


--
-- TOC entry 3799 (class 2606 OID 16865)
-- Name: daily_tasks daily_tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.daily_tasks
    ADD CONSTRAINT daily_tasks_pkey PRIMARY KEY (task_id);


--
-- TOC entry 3886 (class 2606 OID 17294)
-- Name: entity_analytics entity_analytics_pkey; Type: CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.entity_analytics
    ADD CONSTRAINT entity_analytics_pkey PRIMARY KEY (entity_id);


--
-- TOC entry 3808 (class 2606 OID 16918)
-- Name: entity_comparisons entity_comparisons_pkey; Type: CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.entity_comparisons
    ADD CONSTRAINT entity_comparisons_pkey PRIMARY KEY (comparison_id);


--
-- TOC entry 3877 (class 2606 OID 17241)
-- Name: entity_metadata entity_metadata_pkey; Type: CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.entity_metadata
    ADD CONSTRAINT entity_metadata_pkey PRIMARY KEY (metadata_id);


--
-- TOC entry 3844 (class 2606 OID 17068)
-- Name: entity_relations entity_relations_pkey; Type: CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.entity_relations
    ADD CONSTRAINT entity_relations_pkey PRIMARY KEY (entity_id, related_entity_id);


--
-- TOC entry 3874 (class 2606 OID 17224)
-- Name: entity_roles entity_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.entity_roles
    ADD CONSTRAINT entity_roles_pkey PRIMARY KEY (role_id);


--
-- TOC entry 3888 (class 2606 OID 17309)
-- Name: entity_views entity_views_pkey; Type: CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.entity_views
    ADD CONSTRAINT entity_views_pkey PRIMARY KEY (view_id);


--
-- TOC entry 3737 (class 2606 OID 16546)
-- Name: followers followers_pkey; Type: CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.followers
    ADD CONSTRAINT followers_pkey PRIMARY KEY (user_id, follower_user_id);


--
-- TOC entry 3734 (class 2606 OID 16535)
-- Name: group_categories group_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.group_categories
    ADD CONSTRAINT group_categories_pkey PRIMARY KEY (category_id);


--
-- TOC entry 3906 (class 2606 OID 17388)
-- Name: group_category_mappings group_category_mappings_pkey; Type: CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.group_category_mappings
    ADD CONSTRAINT group_category_mappings_pkey PRIMARY KEY (group_id, category_id);


--
-- TOC entry 3900 (class 2606 OID 17364)
-- Name: group_invitations group_invitations_pkey; Type: CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.group_invitations
    ADD CONSTRAINT group_invitations_pkey PRIMARY KEY (invitation_id);


--
-- TOC entry 3894 (class 2606 OID 17335)
-- Name: group_memberships group_memberships_pkey; Type: CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.group_memberships
    ADD CONSTRAINT group_memberships_pkey PRIMARY KEY (membership_id);


--
-- TOC entry 3757 (class 2606 OID 16630)
-- Name: msg_conversation_participants msg_conversation_participants_pkey; Type: CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.msg_conversation_participants
    ADD CONSTRAINT msg_conversation_participants_pkey PRIMARY KEY (participant_id);


--
-- TOC entry 3718 (class 2606 OID 16480)
-- Name: msg_conversations msg_conversations_pkey; Type: CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.msg_conversations
    ADD CONSTRAINT msg_conversations_pkey PRIMARY KEY (conversation_id);


--
-- TOC entry 3847 (class 2606 OID 17088)
-- Name: msg_message_attachments msg_message_attachments_pkey; Type: CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.msg_message_attachments
    ADD CONSTRAINT msg_message_attachments_pkey PRIMARY KEY (attachment_id);


--
-- TOC entry 3872 (class 2606 OID 17199)
-- Name: msg_message_mentions msg_message_mentions_pkey; Type: CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.msg_message_mentions
    ADD CONSTRAINT msg_message_mentions_pkey PRIMARY KEY (mention_id);


--
-- TOC entry 3866 (class 2606 OID 17173)
-- Name: msg_message_pins msg_message_pins_pkey; Type: CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.msg_message_pins
    ADD CONSTRAINT msg_message_pins_pkey PRIMARY KEY (pin_id);


--
-- TOC entry 3850 (class 2606 OID 17102)
-- Name: msg_message_reactions msg_message_reactions_pkey; Type: CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.msg_message_reactions
    ADD CONSTRAINT msg_message_reactions_pkey PRIMARY KEY (reaction_id);


--
-- TOC entry 3855 (class 2606 OID 17122)
-- Name: msg_message_status msg_message_status_pkey; Type: CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.msg_message_status
    ADD CONSTRAINT msg_message_status_pkey PRIMARY KEY (status_id);


--
-- TOC entry 3760 (class 2606 OID 16652)
-- Name: msg_messages msg_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.msg_messages
    ADD CONSTRAINT msg_messages_pkey PRIMARY KEY (message_id);


--
-- TOC entry 3861 (class 2606 OID 17146)
-- Name: msg_threads msg_threads_pkey; Type: CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.msg_threads
    ADD CONSTRAINT msg_threads_pkey PRIMARY KEY (thread_id);


--
-- TOC entry 3765 (class 2606 OID 16677)
-- Name: msg_typing_indicators msg_typing_indicators_pkey; Type: CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.msg_typing_indicators
    ADD CONSTRAINT msg_typing_indicators_pkey PRIMARY KEY (typing_id);


--
-- TOC entry 3770 (class 2606 OID 16702)
-- Name: msg_user_presence msg_user_presence_pkey; Type: CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.msg_user_presence
    ADD CONSTRAINT msg_user_presence_pkey PRIMARY KEY (presence_id);


--
-- TOC entry 3772 (class 2606 OID 16704)
-- Name: msg_user_presence msg_user_presence_user_id_key; Type: CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.msg_user_presence
    ADD CONSTRAINT msg_user_presence_user_id_key UNIQUE (user_id);


--
-- TOC entry 3935 (class 2606 OID 17495)
-- Name: review_comment_reactions review_comment_reactions_pkey; Type: CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.review_comment_reactions
    ADD CONSTRAINT review_comment_reactions_pkey PRIMARY KEY (reaction_id);


--
-- TOC entry 3910 (class 2606 OID 17409)
-- Name: review_comments review_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.review_comments
    ADD CONSTRAINT review_comments_pkey PRIMARY KEY (comment_id);


--
-- TOC entry 3839 (class 2606 OID 17034)
-- Name: review_groups review_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.review_groups
    ADD CONSTRAINT review_groups_pkey PRIMARY KEY (group_id);


--
-- TOC entry 3842 (class 2606 OID 17052)
-- Name: review_main review_main_pkey; Type: CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.review_main
    ADD CONSTRAINT review_main_pkey PRIMARY KEY (review_id);


--
-- TOC entry 3918 (class 2606 OID 17429)
-- Name: review_reactions review_reactions_pkey; Type: CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.review_reactions
    ADD CONSTRAINT review_reactions_pkey PRIMARY KEY (reaction_id);


--
-- TOC entry 3806 (class 2606 OID 16897)
-- Name: review_templates review_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.review_templates
    ADD CONSTRAINT review_templates_pkey PRIMARY KEY (template_id);


--
-- TOC entry 3923 (class 2606 OID 17450)
-- Name: review_versions review_versions_pkey; Type: CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.review_versions
    ADD CONSTRAINT review_versions_pkey PRIMARY KEY (version_id);


--
-- TOC entry 3931 (class 2606 OID 17471)
-- Name: review_views review_views_pkey; Type: CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.review_views
    ADD CONSTRAINT review_views_pkey PRIMARY KEY (view_id);


--
-- TOC entry 3884 (class 2606 OID 17277)
-- Name: search_analytics search_analytics_pkey; Type: CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.search_analytics
    ADD CONSTRAINT search_analytics_pkey PRIMARY KEY (search_id);


--
-- TOC entry 3814 (class 2606 OID 16935)
-- Name: social_circle_blocks social_circle_blocks_pkey; Type: CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.social_circle_blocks
    ADD CONSTRAINT social_circle_blocks_pkey PRIMARY KEY (block_id);


--
-- TOC entry 3820 (class 2606 OID 16960)
-- Name: social_circle_members social_circle_members_pkey; Type: CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.social_circle_members
    ADD CONSTRAINT social_circle_members_pkey PRIMARY KEY (circle_id);


--
-- TOC entry 3828 (class 2606 OID 16988)
-- Name: social_circle_requests social_circle_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.social_circle_requests
    ADD CONSTRAINT social_circle_requests_pkey PRIMARY KEY (request_id);


--
-- TOC entry 3722 (class 2606 OID 16493)
-- Name: unified_categories unified_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.unified_categories
    ADD CONSTRAINT unified_categories_pkey PRIMARY KEY (id);


--
-- TOC entry 3898 (class 2606 OID 17337)
-- Name: group_memberships unique_group_user_membership; Type: CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.group_memberships
    ADD CONSTRAINT unique_group_user_membership UNIQUE (group_id, user_id);


--
-- TOC entry 3822 (class 2606 OID 16962)
-- Name: social_circle_members unique_member_owner_connection; Type: CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.social_circle_members
    ADD CONSTRAINT unique_member_owner_connection UNIQUE (member_id, owner_id);


--
-- TOC entry 3904 (class 2606 OID 17366)
-- Name: group_invitations unique_pending_invitation; Type: CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.group_invitations
    ADD CONSTRAINT unique_pending_invitation UNIQUE (group_id, invitee_id, status);


--
-- TOC entry 3830 (class 2606 OID 16990)
-- Name: social_circle_requests unique_pending_request; Type: CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.social_circle_requests
    ADD CONSTRAINT unique_pending_request UNIQUE (requester_id, recipient_id, status);


--
-- TOC entry 3920 (class 2606 OID 17535)
-- Name: review_reactions uq_review_reactions_user_review; Type: CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.review_reactions
    ADD CONSTRAINT uq_review_reactions_user_review UNIQUE (user_id, review_id);


--
-- TOC entry 3739 (class 2606 OID 16562)
-- Name: user_badges user_badges_pkey; Type: CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.user_badges
    ADD CONSTRAINT user_badges_pkey PRIMARY KEY (user_id, badge_id);


--
-- TOC entry 3776 (class 2606 OID 16731)
-- Name: user_connections user_connections_pkey; Type: CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.user_connections
    ADD CONSTRAINT user_connections_pkey PRIMARY KEY (user_id, target_user_id);


--
-- TOC entry 3881 (class 2606 OID 17256)
-- Name: user_entity_views user_entity_views_pkey; Type: CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.user_entity_views
    ADD CONSTRAINT user_entity_views_pkey PRIMARY KEY (view_id);


--
-- TOC entry 3786 (class 2606 OID 16786)
-- Name: user_events user_events_pkey; Type: CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.user_events
    ADD CONSTRAINT user_events_pkey PRIMARY KEY (event_id);


--
-- TOC entry 3774 (class 2606 OID 16719)
-- Name: user_profiles user_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT user_profiles_pkey PRIMARY KEY (user_id);


--
-- TOC entry 3791 (class 2606 OID 16816)
-- Name: user_progress user_progress_pkey; Type: CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.user_progress
    ADD CONSTRAINT user_progress_pkey PRIMARY KEY (user_id);


--
-- TOC entry 3789 (class 2606 OID 16803)
-- Name: user_search_history user_search_history_pkey; Type: CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.user_search_history
    ADD CONSTRAINT user_search_history_pkey PRIMARY KEY (search_id);


--
-- TOC entry 3779 (class 2606 OID 16753)
-- Name: user_sessions user_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_pkey PRIMARY KEY (session_id);


--
-- TOC entry 3781 (class 2606 OID 16755)
-- Name: user_sessions user_sessions_token_hash_key; Type: CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_token_hash_key UNIQUE (token_hash);


--
-- TOC entry 3783 (class 2606 OID 16770)
-- Name: user_settings user_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.user_settings
    ADD CONSTRAINT user_settings_pkey PRIMARY KEY (user_id);


--
-- TOC entry 3732 (class 2606 OID 16522)
-- Name: view_analytics view_analytics_pkey; Type: CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.view_analytics
    ADD CONSTRAINT view_analytics_pkey PRIMARY KEY (analytics_id);


--
-- TOC entry 3797 (class 2606 OID 16850)
-- Name: weekly_engagement weekly_engagement_pkey; Type: CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.weekly_engagement
    ADD CONSTRAINT weekly_engagement_pkey PRIMARY KEY (engagement_id);


--
-- TOC entry 3803 (class 2606 OID 16880)
-- Name: whats_next_goals whats_next_goals_pkey; Type: CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.whats_next_goals
    ADD CONSTRAINT whats_next_goals_pkey PRIMARY KEY (goal_id);


--
-- TOC entry 3889 (class 1259 OID 17320)
-- Name: idx_entity_views_entity_ip; Type: INDEX; Schema: public; Owner: reviewinn_user
--

CREATE INDEX idx_entity_views_entity_ip ON public.entity_views USING btree (entity_id, ip_address);


--
-- TOC entry 3890 (class 1259 OID 17323)
-- Name: idx_entity_views_entity_user; Type: INDEX; Schema: public; Owner: reviewinn_user
--

CREATE INDEX idx_entity_views_entity_user ON public.entity_views USING btree (entity_id, user_id);


--
-- TOC entry 3891 (class 1259 OID 17322)
-- Name: idx_entity_views_expires_at; Type: INDEX; Schema: public; Owner: reviewinn_user
--

CREATE INDEX idx_entity_views_expires_at ON public.entity_views USING btree (expires_at);


--
-- TOC entry 3901 (class 1259 OID 17382)
-- Name: idx_group_invitations_invitee_status; Type: INDEX; Schema: public; Owner: reviewinn_user
--

CREATE INDEX idx_group_invitations_invitee_status ON public.group_invitations USING btree (invitee_id, status);


--
-- TOC entry 3895 (class 1259 OID 17353)
-- Name: idx_group_memberships_group_user; Type: INDEX; Schema: public; Owner: reviewinn_user
--

CREATE INDEX idx_group_memberships_group_user ON public.group_memberships USING btree (group_id, user_id);


--
-- TOC entry 3867 (class 1259 OID 17211)
-- Name: idx_mention_acknowledged; Type: INDEX; Schema: public; Owner: reviewinn_user
--

CREATE INDEX idx_mention_acknowledged ON public.msg_message_mentions USING btree (mentioned_user_id, is_acknowledged);


--
-- TOC entry 3868 (class 1259 OID 17212)
-- Name: idx_mention_message; Type: INDEX; Schema: public; Owner: reviewinn_user
--

CREATE INDEX idx_mention_message ON public.msg_message_mentions USING btree (message_id);


--
-- TOC entry 3869 (class 1259 OID 17213)
-- Name: idx_mention_user; Type: INDEX; Schema: public; Owner: reviewinn_user
--

CREATE INDEX idx_mention_user ON public.msg_message_mentions USING btree (mentioned_user_id);


--
-- TOC entry 3851 (class 1259 OID 17134)
-- Name: idx_message_status_message_user; Type: INDEX; Schema: public; Owner: reviewinn_user
--

CREATE INDEX idx_message_status_message_user ON public.msg_message_status USING btree (message_id, user_id);


--
-- TOC entry 3852 (class 1259 OID 17135)
-- Name: idx_message_status_user_status; Type: INDEX; Schema: public; Owner: reviewinn_user
--

CREATE INDEX idx_message_status_user_status ON public.msg_message_status USING btree (user_id, status);


--
-- TOC entry 3862 (class 1259 OID 17191)
-- Name: idx_pin_conversation_active; Type: INDEX; Schema: public; Owner: reviewinn_user
--

CREATE INDEX idx_pin_conversation_active ON public.msg_message_pins USING btree (conversation_id, is_active);


--
-- TOC entry 3863 (class 1259 OID 17189)
-- Name: idx_pin_message; Type: INDEX; Schema: public; Owner: reviewinn_user
--

CREATE INDEX idx_pin_message ON public.msg_message_pins USING btree (message_id);


--
-- TOC entry 3766 (class 1259 OID 16712)
-- Name: idx_presence_last_seen; Type: INDEX; Schema: public; Owner: reviewinn_user
--

CREATE INDEX idx_presence_last_seen ON public.msg_user_presence USING btree (last_seen);


--
-- TOC entry 3767 (class 1259 OID 16710)
-- Name: idx_presence_user_status; Type: INDEX; Schema: public; Owner: reviewinn_user
--

CREATE INDEX idx_presence_user_status ON public.msg_user_presence USING btree (user_id, status);


--
-- TOC entry 3932 (class 1259 OID 17528)
-- Name: idx_review_comment_reactions_comment_id_for_count; Type: INDEX; Schema: public; Owner: reviewinn_user
--

CREATE INDEX idx_review_comment_reactions_comment_id_for_count ON public.review_comment_reactions USING btree (comment_id) WHERE (comment_id IS NOT NULL);


--
-- TOC entry 3907 (class 1259 OID 17527)
-- Name: idx_review_comments_review_id_for_count; Type: INDEX; Schema: public; Owner: reviewinn_user
--

CREATE INDEX idx_review_comments_review_id_for_count ON public.review_comments USING btree (review_id) WHERE (review_id IS NOT NULL);


--
-- TOC entry 3911 (class 1259 OID 17538)
-- Name: idx_review_reactions_review_analytics; Type: INDEX; Schema: public; Owner: reviewinn_user
--

CREATE INDEX idx_review_reactions_review_analytics ON public.review_reactions USING btree (review_id, reaction_type, created_at);


--
-- TOC entry 3912 (class 1259 OID 17529)
-- Name: idx_review_reactions_review_id_type_for_count; Type: INDEX; Schema: public; Owner: reviewinn_user
--

CREATE INDEX idx_review_reactions_review_id_type_for_count ON public.review_reactions USING btree (review_id, reaction_type) WHERE (review_id IS NOT NULL);


--
-- TOC entry 3913 (class 1259 OID 17539)
-- Name: idx_review_reactions_type_created; Type: INDEX; Schema: public; Owner: reviewinn_user
--

CREATE INDEX idx_review_reactions_type_created ON public.review_reactions USING btree (reaction_type, created_at DESC);


--
-- TOC entry 3914 (class 1259 OID 17537)
-- Name: idx_review_reactions_user_created; Type: INDEX; Schema: public; Owner: reviewinn_user
--

CREATE INDEX idx_review_reactions_user_created ON public.review_reactions USING btree (user_id, created_at DESC);


--
-- TOC entry 3915 (class 1259 OID 17536)
-- Name: idx_review_reactions_user_review_optimized; Type: INDEX; Schema: public; Owner: reviewinn_user
--

CREATE INDEX idx_review_reactions_user_review_optimized ON public.review_reactions USING btree (user_id, review_id);


--
-- TOC entry 3924 (class 1259 OID 17485)
-- Name: idx_review_views_expires_at; Type: INDEX; Schema: public; Owner: reviewinn_user
--

CREATE INDEX idx_review_views_expires_at ON public.review_views USING btree (expires_at);


--
-- TOC entry 3925 (class 1259 OID 17533)
-- Name: idx_review_views_review_id_valid_simple; Type: INDEX; Schema: public; Owner: reviewinn_user
--

CREATE INDEX idx_review_views_review_id_valid_simple ON public.review_views USING btree (review_id, is_valid, expires_at);


--
-- TOC entry 3926 (class 1259 OID 17484)
-- Name: idx_review_views_review_ip; Type: INDEX; Schema: public; Owner: reviewinn_user
--

CREATE INDEX idx_review_views_review_ip ON public.review_views USING btree (review_id, ip_address);


--
-- TOC entry 3927 (class 1259 OID 17482)
-- Name: idx_review_views_review_user; Type: INDEX; Schema: public; Owner: reviewinn_user
--

CREATE INDEX idx_review_views_review_user ON public.review_views USING btree (review_id, user_id);


--
-- TOC entry 3928 (class 1259 OID 17486)
-- Name: idx_review_views_viewed_at; Type: INDEX; Schema: public; Owner: reviewinn_user
--

CREATE INDEX idx_review_views_viewed_at ON public.review_views USING btree (viewed_at);


--
-- TOC entry 3810 (class 1259 OID 16947)
-- Name: idx_social_circle_blocks_blocked; Type: INDEX; Schema: public; Owner: reviewinn_user
--

CREATE INDEX idx_social_circle_blocks_blocked ON public.social_circle_blocks USING btree (blocked_user_id);


--
-- TOC entry 3811 (class 1259 OID 16948)
-- Name: idx_social_circle_blocks_blocker; Type: INDEX; Schema: public; Owner: reviewinn_user
--

CREATE INDEX idx_social_circle_blocks_blocker ON public.social_circle_blocks USING btree (blocker_id);


--
-- TOC entry 3815 (class 1259 OID 16974)
-- Name: idx_social_circle_members_member_id; Type: INDEX; Schema: public; Owner: reviewinn_user
--

CREATE INDEX idx_social_circle_members_member_id ON public.social_circle_members USING btree (member_id);


--
-- TOC entry 3816 (class 1259 OID 16976)
-- Name: idx_social_circle_members_membership_type; Type: INDEX; Schema: public; Owner: reviewinn_user
--

CREATE INDEX idx_social_circle_members_membership_type ON public.social_circle_members USING btree (membership_type);


--
-- TOC entry 3817 (class 1259 OID 16973)
-- Name: idx_social_circle_members_owner_id; Type: INDEX; Schema: public; Owner: reviewinn_user
--

CREATE INDEX idx_social_circle_members_owner_id ON public.social_circle_members USING btree (owner_id);


--
-- TOC entry 3823 (class 1259 OID 17003)
-- Name: idx_social_circle_requests_created_at; Type: INDEX; Schema: public; Owner: reviewinn_user
--

CREATE INDEX idx_social_circle_requests_created_at ON public.social_circle_requests USING btree (created_at);


--
-- TOC entry 3824 (class 1259 OID 17001)
-- Name: idx_social_circle_requests_recipient_status; Type: INDEX; Schema: public; Owner: reviewinn_user
--

CREATE INDEX idx_social_circle_requests_recipient_status ON public.social_circle_requests USING btree (recipient_id, status);


--
-- TOC entry 3825 (class 1259 OID 17002)
-- Name: idx_social_circle_requests_requester; Type: INDEX; Schema: public; Owner: reviewinn_user
--

CREATE INDEX idx_social_circle_requests_requester ON public.social_circle_requests USING btree (requester_id);


--
-- TOC entry 3856 (class 1259 OID 17162)
-- Name: idx_thread_conversation; Type: INDEX; Schema: public; Owner: reviewinn_user
--

CREATE INDEX idx_thread_conversation ON public.msg_threads USING btree (conversation_id);


--
-- TOC entry 3857 (class 1259 OID 17165)
-- Name: idx_thread_last_reply; Type: INDEX; Schema: public; Owner: reviewinn_user
--

CREATE INDEX idx_thread_last_reply ON public.msg_threads USING btree (last_reply_at);


--
-- TOC entry 3858 (class 1259 OID 17163)
-- Name: idx_thread_parent_message; Type: INDEX; Schema: public; Owner: reviewinn_user
--

CREATE INDEX idx_thread_parent_message ON public.msg_threads USING btree (parent_message_id);


--
-- TOC entry 3761 (class 1259 OID 16688)
-- Name: idx_typing_conversation_user; Type: INDEX; Schema: public; Owner: reviewinn_user
--

CREATE INDEX idx_typing_conversation_user ON public.msg_typing_indicators USING btree (conversation_id, user_id);


--
-- TOC entry 3762 (class 1259 OID 16690)
-- Name: idx_typing_last_activity; Type: INDEX; Schema: public; Owner: reviewinn_user
--

CREATE INDEX idx_typing_last_activity ON public.msg_typing_indicators USING btree (last_activity);


--
-- TOC entry 3728 (class 1259 OID 16525)
-- Name: idx_view_analytics_content; Type: INDEX; Schema: public; Owner: reviewinn_user
--

CREATE INDEX idx_view_analytics_content ON public.view_analytics USING btree (content_type, content_id);


--
-- TOC entry 3729 (class 1259 OID 16524)
-- Name: idx_view_analytics_updated; Type: INDEX; Schema: public; Owner: reviewinn_user
--

CREATE INDEX idx_view_analytics_updated ON public.view_analytics USING btree (last_updated);


--
-- TOC entry 3794 (class 1259 OID 16841)
-- Name: ix_badge_awards_award_id; Type: INDEX; Schema: public; Owner: reviewinn_user
--

CREATE INDEX ix_badge_awards_award_id ON public.badge_awards USING btree (award_id);


--
-- TOC entry 3727 (class 1259 OID 16514)
-- Name: ix_badge_definitions_badge_definition_id; Type: INDEX; Schema: public; Owner: reviewinn_user
--

CREATE INDEX ix_badge_definitions_badge_definition_id ON public.badge_definitions USING btree (badge_definition_id);


--
-- TOC entry 3715 (class 1259 OID 16469)
-- Name: ix_badges_badge_id; Type: INDEX; Schema: public; Owner: reviewinn_user
--

CREATE INDEX ix_badges_badge_id ON public.badges USING btree (badge_id);


--
-- TOC entry 3835 (class 1259 OID 17023)
-- Name: ix_category_questions_id; Type: INDEX; Schema: public; Owner: reviewinn_user
--

CREATE INDEX ix_category_questions_id ON public.category_questions USING btree (id);


--
-- TOC entry 3742 (class 1259 OID 16588)
-- Name: ix_core_entities_entity_id; Type: INDEX; Schema: public; Owner: reviewinn_user
--

CREATE INDEX ix_core_entities_entity_id ON public.core_entities USING btree (entity_id);


--
-- TOC entry 3743 (class 1259 OID 16589)
-- Name: ix_core_entities_name; Type: INDEX; Schema: public; Owner: reviewinn_user
--

CREATE INDEX ix_core_entities_name ON public.core_entities USING btree (name);


--
-- TOC entry 3746 (class 1259 OID 16614)
-- Name: ix_core_notifications_created_at; Type: INDEX; Schema: public; Owner: reviewinn_user
--

CREATE INDEX ix_core_notifications_created_at ON public.core_notifications USING btree (created_at);


--
-- TOC entry 3747 (class 1259 OID 16615)
-- Name: ix_core_notifications_delivery_status; Type: INDEX; Schema: public; Owner: reviewinn_user
--

CREATE INDEX ix_core_notifications_delivery_status ON public.core_notifications USING btree (delivery_status);


--
-- TOC entry 3748 (class 1259 OID 16612)
-- Name: ix_core_notifications_entity_id; Type: INDEX; Schema: public; Owner: reviewinn_user
--

CREATE INDEX ix_core_notifications_entity_id ON public.core_notifications USING btree (entity_id);


--
-- TOC entry 3749 (class 1259 OID 16616)
-- Name: ix_core_notifications_entity_type; Type: INDEX; Schema: public; Owner: reviewinn_user
--

CREATE INDEX ix_core_notifications_entity_type ON public.core_notifications USING btree (entity_type);


--
-- TOC entry 3750 (class 1259 OID 16613)
-- Name: ix_core_notifications_expires_at; Type: INDEX; Schema: public; Owner: reviewinn_user
--

CREATE INDEX ix_core_notifications_expires_at ON public.core_notifications USING btree (expires_at);


--
-- TOC entry 3751 (class 1259 OID 16611)
-- Name: ix_core_notifications_is_read; Type: INDEX; Schema: public; Owner: reviewinn_user
--

CREATE INDEX ix_core_notifications_is_read ON public.core_notifications USING btree (is_read);


--
-- TOC entry 3752 (class 1259 OID 16618)
-- Name: ix_core_notifications_priority; Type: INDEX; Schema: public; Owner: reviewinn_user
--

CREATE INDEX ix_core_notifications_priority ON public.core_notifications USING btree (priority);


--
-- TOC entry 3753 (class 1259 OID 16617)
-- Name: ix_core_notifications_type; Type: INDEX; Schema: public; Owner: reviewinn_user
--

CREATE INDEX ix_core_notifications_type ON public.core_notifications USING btree (type);


--
-- TOC entry 3754 (class 1259 OID 16619)
-- Name: ix_core_notifications_user_id; Type: INDEX; Schema: public; Owner: reviewinn_user
--

CREATE INDEX ix_core_notifications_user_id ON public.core_notifications USING btree (user_id);


--
-- TOC entry 3712 (class 1259 OID 16459)
-- Name: ix_core_users_user_id; Type: INDEX; Schema: public; Owner: reviewinn_user
--

CREATE INDEX ix_core_users_user_id ON public.core_users USING btree (user_id);


--
-- TOC entry 3800 (class 1259 OID 16871)
-- Name: ix_daily_tasks_task_id; Type: INDEX; Schema: public; Owner: reviewinn_user
--

CREATE INDEX ix_daily_tasks_task_id ON public.daily_tasks USING btree (task_id);


--
-- TOC entry 3809 (class 1259 OID 16924)
-- Name: ix_entity_comparisons_comparison_id; Type: INDEX; Schema: public; Owner: reviewinn_user
--

CREATE INDEX ix_entity_comparisons_comparison_id ON public.entity_comparisons USING btree (comparison_id);


--
-- TOC entry 3878 (class 1259 OID 17247)
-- Name: ix_entity_metadata_metadata_id; Type: INDEX; Schema: public; Owner: reviewinn_user
--

CREATE INDEX ix_entity_metadata_metadata_id ON public.entity_metadata USING btree (metadata_id);


--
-- TOC entry 3875 (class 1259 OID 17230)
-- Name: ix_entity_roles_role_id; Type: INDEX; Schema: public; Owner: reviewinn_user
--

CREATE INDEX ix_entity_roles_role_id ON public.entity_roles USING btree (role_id);


--
-- TOC entry 3892 (class 1259 OID 17321)
-- Name: ix_entity_views_view_id; Type: INDEX; Schema: public; Owner: reviewinn_user
--

CREATE INDEX ix_entity_views_view_id ON public.entity_views USING btree (view_id);


--
-- TOC entry 3735 (class 1259 OID 16541)
-- Name: ix_group_categories_category_id; Type: INDEX; Schema: public; Owner: reviewinn_user
--

CREATE INDEX ix_group_categories_category_id ON public.group_categories USING btree (category_id);


--
-- TOC entry 3902 (class 1259 OID 17383)
-- Name: ix_group_invitations_invitation_id; Type: INDEX; Schema: public; Owner: reviewinn_user
--

CREATE INDEX ix_group_invitations_invitation_id ON public.group_invitations USING btree (invitation_id);


--
-- TOC entry 3896 (class 1259 OID 17354)
-- Name: ix_group_memberships_membership_id; Type: INDEX; Schema: public; Owner: reviewinn_user
--

CREATE INDEX ix_group_memberships_membership_id ON public.group_memberships USING btree (membership_id);


--
-- TOC entry 3755 (class 1259 OID 16641)
-- Name: ix_msg_conversation_participants_participant_id; Type: INDEX; Schema: public; Owner: reviewinn_user
--

CREATE INDEX ix_msg_conversation_participants_participant_id ON public.msg_conversation_participants USING btree (participant_id);


--
-- TOC entry 3716 (class 1259 OID 16481)
-- Name: ix_msg_conversations_conversation_id; Type: INDEX; Schema: public; Owner: reviewinn_user
--

CREATE INDEX ix_msg_conversations_conversation_id ON public.msg_conversations USING btree (conversation_id);


--
-- TOC entry 3845 (class 1259 OID 17094)
-- Name: ix_msg_message_attachments_attachment_id; Type: INDEX; Schema: public; Owner: reviewinn_user
--

CREATE INDEX ix_msg_message_attachments_attachment_id ON public.msg_message_attachments USING btree (attachment_id);


--
-- TOC entry 3870 (class 1259 OID 17210)
-- Name: ix_msg_message_mentions_mention_id; Type: INDEX; Schema: public; Owner: reviewinn_user
--

CREATE INDEX ix_msg_message_mentions_mention_id ON public.msg_message_mentions USING btree (mention_id);


--
-- TOC entry 3864 (class 1259 OID 17190)
-- Name: ix_msg_message_pins_pin_id; Type: INDEX; Schema: public; Owner: reviewinn_user
--

CREATE INDEX ix_msg_message_pins_pin_id ON public.msg_message_pins USING btree (pin_id);


--
-- TOC entry 3848 (class 1259 OID 17113)
-- Name: ix_msg_message_reactions_reaction_id; Type: INDEX; Schema: public; Owner: reviewinn_user
--

CREATE INDEX ix_msg_message_reactions_reaction_id ON public.msg_message_reactions USING btree (reaction_id);


--
-- TOC entry 3853 (class 1259 OID 17133)
-- Name: ix_msg_message_status_status_id; Type: INDEX; Schema: public; Owner: reviewinn_user
--

CREATE INDEX ix_msg_message_status_status_id ON public.msg_message_status USING btree (status_id);


--
-- TOC entry 3758 (class 1259 OID 16668)
-- Name: ix_msg_messages_message_id; Type: INDEX; Schema: public; Owner: reviewinn_user
--

CREATE INDEX ix_msg_messages_message_id ON public.msg_messages USING btree (message_id);


--
-- TOC entry 3859 (class 1259 OID 17164)
-- Name: ix_msg_threads_thread_id; Type: INDEX; Schema: public; Owner: reviewinn_user
--

CREATE INDEX ix_msg_threads_thread_id ON public.msg_threads USING btree (thread_id);


--
-- TOC entry 3763 (class 1259 OID 16689)
-- Name: ix_msg_typing_indicators_typing_id; Type: INDEX; Schema: public; Owner: reviewinn_user
--

CREATE INDEX ix_msg_typing_indicators_typing_id ON public.msg_typing_indicators USING btree (typing_id);


--
-- TOC entry 3768 (class 1259 OID 16711)
-- Name: ix_msg_user_presence_presence_id; Type: INDEX; Schema: public; Owner: reviewinn_user
--

CREATE INDEX ix_msg_user_presence_presence_id ON public.msg_user_presence USING btree (presence_id);


--
-- TOC entry 3933 (class 1259 OID 17506)
-- Name: ix_review_comment_reactions_reaction_id; Type: INDEX; Schema: public; Owner: reviewinn_user
--

CREATE INDEX ix_review_comment_reactions_reaction_id ON public.review_comment_reactions USING btree (reaction_id);


--
-- TOC entry 3908 (class 1259 OID 17420)
-- Name: ix_review_comments_comment_id; Type: INDEX; Schema: public; Owner: reviewinn_user
--

CREATE INDEX ix_review_comments_comment_id ON public.review_comments USING btree (comment_id);


--
-- TOC entry 3836 (class 1259 OID 17041)
-- Name: ix_review_groups_group_id; Type: INDEX; Schema: public; Owner: reviewinn_user
--

CREATE INDEX ix_review_groups_group_id ON public.review_groups USING btree (group_id);


--
-- TOC entry 3837 (class 1259 OID 17040)
-- Name: ix_review_groups_name; Type: INDEX; Schema: public; Owner: reviewinn_user
--

CREATE INDEX ix_review_groups_name ON public.review_groups USING btree (name);


--
-- TOC entry 3840 (class 1259 OID 17063)
-- Name: ix_review_main_review_id; Type: INDEX; Schema: public; Owner: reviewinn_user
--

CREATE INDEX ix_review_main_review_id ON public.review_main USING btree (review_id);


--
-- TOC entry 3916 (class 1259 OID 17440)
-- Name: ix_review_reactions_reaction_id; Type: INDEX; Schema: public; Owner: reviewinn_user
--

CREATE INDEX ix_review_reactions_reaction_id ON public.review_reactions USING btree (reaction_id);


--
-- TOC entry 3804 (class 1259 OID 16908)
-- Name: ix_review_templates_template_id; Type: INDEX; Schema: public; Owner: reviewinn_user
--

CREATE INDEX ix_review_templates_template_id ON public.review_templates USING btree (template_id);


--
-- TOC entry 3921 (class 1259 OID 17461)
-- Name: ix_review_versions_version_id; Type: INDEX; Schema: public; Owner: reviewinn_user
--

CREATE INDEX ix_review_versions_version_id ON public.review_versions USING btree (version_id);


--
-- TOC entry 3929 (class 1259 OID 17483)
-- Name: ix_review_views_view_id; Type: INDEX; Schema: public; Owner: reviewinn_user
--

CREATE INDEX ix_review_views_view_id ON public.review_views USING btree (view_id);


--
-- TOC entry 3882 (class 1259 OID 17288)
-- Name: ix_search_analytics_search_id; Type: INDEX; Schema: public; Owner: reviewinn_user
--

CREATE INDEX ix_search_analytics_search_id ON public.search_analytics USING btree (search_id);


--
-- TOC entry 3812 (class 1259 OID 16946)
-- Name: ix_social_circle_blocks_block_id; Type: INDEX; Schema: public; Owner: reviewinn_user
--

CREATE INDEX ix_social_circle_blocks_block_id ON public.social_circle_blocks USING btree (block_id);


--
-- TOC entry 3818 (class 1259 OID 16975)
-- Name: ix_social_circle_members_circle_id; Type: INDEX; Schema: public; Owner: reviewinn_user
--

CREATE INDEX ix_social_circle_members_circle_id ON public.social_circle_members USING btree (circle_id);


--
-- TOC entry 3826 (class 1259 OID 17004)
-- Name: ix_social_circle_requests_request_id; Type: INDEX; Schema: public; Owner: reviewinn_user
--

CREATE INDEX ix_social_circle_requests_request_id ON public.social_circle_requests USING btree (request_id);


--
-- TOC entry 3719 (class 1259 OID 16500)
-- Name: ix_unified_categories_id; Type: INDEX; Schema: public; Owner: reviewinn_user
--

CREATE INDEX ix_unified_categories_id ON public.unified_categories USING btree (id);


--
-- TOC entry 3720 (class 1259 OID 16499)
-- Name: ix_unified_categories_path; Type: INDEX; Schema: public; Owner: reviewinn_user
--

CREATE INDEX ix_unified_categories_path ON public.unified_categories USING btree (path);


--
-- TOC entry 3879 (class 1259 OID 17267)
-- Name: ix_user_entity_views_view_id; Type: INDEX; Schema: public; Owner: reviewinn_user
--

CREATE INDEX ix_user_entity_views_view_id ON public.user_entity_views USING btree (view_id);


--
-- TOC entry 3784 (class 1259 OID 16792)
-- Name: ix_user_events_event_id; Type: INDEX; Schema: public; Owner: reviewinn_user
--

CREATE INDEX ix_user_events_event_id ON public.user_events USING btree (event_id);


--
-- TOC entry 3787 (class 1259 OID 16809)
-- Name: ix_user_search_history_search_id; Type: INDEX; Schema: public; Owner: reviewinn_user
--

CREATE INDEX ix_user_search_history_search_id ON public.user_search_history USING btree (search_id);


--
-- TOC entry 3777 (class 1259 OID 16761)
-- Name: ix_user_sessions_session_id; Type: INDEX; Schema: public; Owner: reviewinn_user
--

CREATE INDEX ix_user_sessions_session_id ON public.user_sessions USING btree (session_id);


--
-- TOC entry 3730 (class 1259 OID 16523)
-- Name: ix_view_analytics_analytics_id; Type: INDEX; Schema: public; Owner: reviewinn_user
--

CREATE INDEX ix_view_analytics_analytics_id ON public.view_analytics USING btree (analytics_id);


--
-- TOC entry 3795 (class 1259 OID 16856)
-- Name: ix_weekly_engagement_engagement_id; Type: INDEX; Schema: public; Owner: reviewinn_user
--

CREATE INDEX ix_weekly_engagement_engagement_id ON public.weekly_engagement USING btree (engagement_id);


--
-- TOC entry 3801 (class 1259 OID 16886)
-- Name: ix_whats_next_goals_goal_id; Type: INDEX; Schema: public; Owner: reviewinn_user
--

CREATE INDEX ix_whats_next_goals_goal_id ON public.whats_next_goals USING btree (goal_id);


--
-- TOC entry 4021 (class 2620 OID 17556)
-- Name: core_users tr_core_users_updated_at; Type: TRIGGER; Schema: public; Owner: reviewinn_user
--

CREATE TRIGGER tr_core_users_updated_at BEFORE UPDATE ON public.core_users FOR EACH ROW EXECUTE FUNCTION public.update_core_users_updated_at();


--
-- TOC entry 4025 (class 2620 OID 17524)
-- Name: review_comment_reactions trigger_update_comment_reaction_count; Type: TRIGGER; Schema: public; Owner: reviewinn_user
--

CREATE TRIGGER trigger_update_comment_reaction_count AFTER INSERT OR DELETE OR UPDATE OF comment_id ON public.review_comment_reactions FOR EACH ROW EXECUTE FUNCTION public.update_comment_reaction_count();


--
-- TOC entry 4022 (class 2620 OID 17523)
-- Name: review_comments trigger_update_review_comment_count; Type: TRIGGER; Schema: public; Owner: reviewinn_user
--

CREATE TRIGGER trigger_update_review_comment_count AFTER INSERT OR DELETE OR UPDATE OF review_id ON public.review_comments FOR EACH ROW EXECUTE FUNCTION public.update_review_comment_count();


--
-- TOC entry 4023 (class 2620 OID 17525)
-- Name: review_reactions trigger_update_review_reaction_count; Type: TRIGGER; Schema: public; Owner: reviewinn_user
--

CREATE TRIGGER trigger_update_review_reaction_count AFTER INSERT OR DELETE OR UPDATE OF review_id ON public.review_reactions FOR EACH ROW EXECUTE FUNCTION public.update_review_reaction_count();


--
-- TOC entry 4024 (class 2620 OID 17526)
-- Name: review_views trigger_update_review_view_count; Type: TRIGGER; Schema: public; Owner: reviewinn_user
--

CREATE TRIGGER trigger_update_review_view_count AFTER INSERT OR DELETE OR UPDATE OF review_id ON public.review_views FOR EACH ROW EXECUTE FUNCTION public.update_review_view_count();


--
-- TOC entry 3961 (class 2606 OID 16836)
-- Name: badge_awards badge_awards_badge_definition_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.badge_awards
    ADD CONSTRAINT badge_awards_badge_definition_id_fkey FOREIGN KEY (badge_definition_id) REFERENCES public.badge_definitions(badge_definition_id) ON DELETE RESTRICT;


--
-- TOC entry 3962 (class 2606 OID 16831)
-- Name: badge_awards badge_awards_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.badge_awards
    ADD CONSTRAINT badge_awards_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.core_users(user_id) ON DELETE CASCADE;


--
-- TOC entry 3975 (class 2606 OID 17018)
-- Name: category_questions category_questions_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.category_questions
    ADD CONSTRAINT category_questions_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.core_users(user_id);


--
-- TOC entry 3942 (class 2606 OID 16583)
-- Name: core_entities core_entities_claimed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.core_entities
    ADD CONSTRAINT core_entities_claimed_by_fkey FOREIGN KEY (claimed_by) REFERENCES public.core_users(user_id);


--
-- TOC entry 3943 (class 2606 OID 16606)
-- Name: core_notifications core_notifications_actor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.core_notifications
    ADD CONSTRAINT core_notifications_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES public.core_users(user_id) ON DELETE SET NULL;


--
-- TOC entry 3944 (class 2606 OID 16601)
-- Name: core_notifications core_notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.core_notifications
    ADD CONSTRAINT core_notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.core_users(user_id) ON DELETE CASCADE;


--
-- TOC entry 3964 (class 2606 OID 16866)
-- Name: daily_tasks daily_tasks_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.daily_tasks
    ADD CONSTRAINT daily_tasks_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.core_users(user_id) ON DELETE CASCADE;


--
-- TOC entry 4000 (class 2606 OID 17295)
-- Name: entity_analytics entity_analytics_entity_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.entity_analytics
    ADD CONSTRAINT entity_analytics_entity_id_fkey FOREIGN KEY (entity_id) REFERENCES public.core_entities(entity_id) ON DELETE CASCADE;


--
-- TOC entry 3968 (class 2606 OID 16919)
-- Name: entity_comparisons entity_comparisons_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.entity_comparisons
    ADD CONSTRAINT entity_comparisons_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.core_users(user_id) ON DELETE SET NULL;


--
-- TOC entry 3995 (class 2606 OID 17242)
-- Name: entity_metadata entity_metadata_entity_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.entity_metadata
    ADD CONSTRAINT entity_metadata_entity_id_fkey FOREIGN KEY (entity_id) REFERENCES public.core_entities(entity_id) ON DELETE CASCADE;


--
-- TOC entry 3979 (class 2606 OID 17069)
-- Name: entity_relations entity_relations_entity_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.entity_relations
    ADD CONSTRAINT entity_relations_entity_id_fkey FOREIGN KEY (entity_id) REFERENCES public.core_entities(entity_id);


--
-- TOC entry 3980 (class 2606 OID 17074)
-- Name: entity_relations entity_relations_related_entity_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.entity_relations
    ADD CONSTRAINT entity_relations_related_entity_id_fkey FOREIGN KEY (related_entity_id) REFERENCES public.core_entities(entity_id);


--
-- TOC entry 3994 (class 2606 OID 17225)
-- Name: entity_roles entity_roles_entity_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.entity_roles
    ADD CONSTRAINT entity_roles_entity_id_fkey FOREIGN KEY (entity_id) REFERENCES public.core_entities(entity_id) ON DELETE CASCADE;


--
-- TOC entry 4001 (class 2606 OID 17310)
-- Name: entity_views entity_views_entity_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.entity_views
    ADD CONSTRAINT entity_views_entity_id_fkey FOREIGN KEY (entity_id) REFERENCES public.core_entities(entity_id);


--
-- TOC entry 4002 (class 2606 OID 17315)
-- Name: entity_views entity_views_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.entity_views
    ADD CONSTRAINT entity_views_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.core_users(user_id);


--
-- TOC entry 3938 (class 2606 OID 16552)
-- Name: followers followers_follower_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.followers
    ADD CONSTRAINT followers_follower_user_id_fkey FOREIGN KEY (follower_user_id) REFERENCES public.core_users(user_id);


--
-- TOC entry 3939 (class 2606 OID 16547)
-- Name: followers followers_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.followers
    ADD CONSTRAINT followers_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.core_users(user_id);


--
-- TOC entry 3937 (class 2606 OID 16536)
-- Name: group_categories group_categories_parent_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.group_categories
    ADD CONSTRAINT group_categories_parent_category_id_fkey FOREIGN KEY (parent_category_id) REFERENCES public.group_categories(category_id);


--
-- TOC entry 4009 (class 2606 OID 17394)
-- Name: group_category_mappings group_category_mappings_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.group_category_mappings
    ADD CONSTRAINT group_category_mappings_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.group_categories(category_id) ON DELETE CASCADE;


--
-- TOC entry 4010 (class 2606 OID 17389)
-- Name: group_category_mappings group_category_mappings_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.group_category_mappings
    ADD CONSTRAINT group_category_mappings_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.review_groups(group_id) ON DELETE CASCADE;


--
-- TOC entry 4006 (class 2606 OID 17367)
-- Name: group_invitations group_invitations_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.group_invitations
    ADD CONSTRAINT group_invitations_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.review_groups(group_id) ON DELETE CASCADE;


--
-- TOC entry 4007 (class 2606 OID 17377)
-- Name: group_invitations group_invitations_invitee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.group_invitations
    ADD CONSTRAINT group_invitations_invitee_id_fkey FOREIGN KEY (invitee_id) REFERENCES public.core_users(user_id) ON DELETE CASCADE;


--
-- TOC entry 4008 (class 2606 OID 17372)
-- Name: group_invitations group_invitations_inviter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.group_invitations
    ADD CONSTRAINT group_invitations_inviter_id_fkey FOREIGN KEY (inviter_id) REFERENCES public.core_users(user_id) ON DELETE CASCADE;


--
-- TOC entry 4003 (class 2606 OID 17338)
-- Name: group_memberships group_memberships_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.group_memberships
    ADD CONSTRAINT group_memberships_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.review_groups(group_id) ON DELETE CASCADE;


--
-- TOC entry 4004 (class 2606 OID 17348)
-- Name: group_memberships group_memberships_invited_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.group_memberships
    ADD CONSTRAINT group_memberships_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES public.core_users(user_id);


--
-- TOC entry 4005 (class 2606 OID 17343)
-- Name: group_memberships group_memberships_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.group_memberships
    ADD CONSTRAINT group_memberships_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.core_users(user_id) ON DELETE CASCADE;


--
-- TOC entry 3945 (class 2606 OID 16631)
-- Name: msg_conversation_participants msg_conversation_participants_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.msg_conversation_participants
    ADD CONSTRAINT msg_conversation_participants_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.msg_conversations(conversation_id) ON DELETE CASCADE;


--
-- TOC entry 3946 (class 2606 OID 16636)
-- Name: msg_conversation_participants msg_conversation_participants_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.msg_conversation_participants
    ADD CONSTRAINT msg_conversation_participants_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.core_users(user_id) ON DELETE CASCADE;


--
-- TOC entry 3981 (class 2606 OID 17089)
-- Name: msg_message_attachments msg_message_attachments_message_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.msg_message_attachments
    ADD CONSTRAINT msg_message_attachments_message_id_fkey FOREIGN KEY (message_id) REFERENCES public.msg_messages(message_id) ON DELETE CASCADE;


--
-- TOC entry 3992 (class 2606 OID 17205)
-- Name: msg_message_mentions msg_message_mentions_mentioned_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.msg_message_mentions
    ADD CONSTRAINT msg_message_mentions_mentioned_user_id_fkey FOREIGN KEY (mentioned_user_id) REFERENCES public.core_users(user_id) ON DELETE CASCADE;


--
-- TOC entry 3993 (class 2606 OID 17200)
-- Name: msg_message_mentions msg_message_mentions_message_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.msg_message_mentions
    ADD CONSTRAINT msg_message_mentions_message_id_fkey FOREIGN KEY (message_id) REFERENCES public.msg_messages(message_id) ON DELETE CASCADE;


--
-- TOC entry 3989 (class 2606 OID 17174)
-- Name: msg_message_pins msg_message_pins_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.msg_message_pins
    ADD CONSTRAINT msg_message_pins_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.msg_conversations(conversation_id) ON DELETE CASCADE;


--
-- TOC entry 3990 (class 2606 OID 17179)
-- Name: msg_message_pins msg_message_pins_message_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.msg_message_pins
    ADD CONSTRAINT msg_message_pins_message_id_fkey FOREIGN KEY (message_id) REFERENCES public.msg_messages(message_id) ON DELETE CASCADE;


--
-- TOC entry 3991 (class 2606 OID 17184)
-- Name: msg_message_pins msg_message_pins_pinned_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.msg_message_pins
    ADD CONSTRAINT msg_message_pins_pinned_by_user_id_fkey FOREIGN KEY (pinned_by_user_id) REFERENCES public.core_users(user_id) ON DELETE CASCADE;


--
-- TOC entry 3982 (class 2606 OID 17103)
-- Name: msg_message_reactions msg_message_reactions_message_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.msg_message_reactions
    ADD CONSTRAINT msg_message_reactions_message_id_fkey FOREIGN KEY (message_id) REFERENCES public.msg_messages(message_id) ON DELETE CASCADE;


--
-- TOC entry 3983 (class 2606 OID 17108)
-- Name: msg_message_reactions msg_message_reactions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.msg_message_reactions
    ADD CONSTRAINT msg_message_reactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.core_users(user_id) ON DELETE CASCADE;


--
-- TOC entry 3984 (class 2606 OID 17123)
-- Name: msg_message_status msg_message_status_message_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.msg_message_status
    ADD CONSTRAINT msg_message_status_message_id_fkey FOREIGN KEY (message_id) REFERENCES public.msg_messages(message_id) ON DELETE CASCADE;


--
-- TOC entry 3985 (class 2606 OID 17128)
-- Name: msg_message_status msg_message_status_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.msg_message_status
    ADD CONSTRAINT msg_message_status_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.core_users(user_id) ON DELETE CASCADE;


--
-- TOC entry 3947 (class 2606 OID 16653)
-- Name: msg_messages msg_messages_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.msg_messages
    ADD CONSTRAINT msg_messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.msg_conversations(conversation_id) ON DELETE CASCADE;


--
-- TOC entry 3948 (class 2606 OID 16663)
-- Name: msg_messages msg_messages_reply_to_message_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.msg_messages
    ADD CONSTRAINT msg_messages_reply_to_message_id_fkey FOREIGN KEY (reply_to_message_id) REFERENCES public.msg_messages(message_id);


--
-- TOC entry 3949 (class 2606 OID 16658)
-- Name: msg_messages msg_messages_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.msg_messages
    ADD CONSTRAINT msg_messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.core_users(user_id) ON DELETE CASCADE;


--
-- TOC entry 3986 (class 2606 OID 17147)
-- Name: msg_threads msg_threads_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.msg_threads
    ADD CONSTRAINT msg_threads_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.msg_conversations(conversation_id) ON DELETE CASCADE;


--
-- TOC entry 3987 (class 2606 OID 17157)
-- Name: msg_threads msg_threads_last_reply_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.msg_threads
    ADD CONSTRAINT msg_threads_last_reply_user_id_fkey FOREIGN KEY (last_reply_user_id) REFERENCES public.core_users(user_id);


--
-- TOC entry 3988 (class 2606 OID 17152)
-- Name: msg_threads msg_threads_parent_message_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.msg_threads
    ADD CONSTRAINT msg_threads_parent_message_id_fkey FOREIGN KEY (parent_message_id) REFERENCES public.msg_messages(message_id) ON DELETE CASCADE;


--
-- TOC entry 3950 (class 2606 OID 16678)
-- Name: msg_typing_indicators msg_typing_indicators_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.msg_typing_indicators
    ADD CONSTRAINT msg_typing_indicators_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.msg_conversations(conversation_id) ON DELETE CASCADE;


--
-- TOC entry 3951 (class 2606 OID 16683)
-- Name: msg_typing_indicators msg_typing_indicators_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.msg_typing_indicators
    ADD CONSTRAINT msg_typing_indicators_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.core_users(user_id) ON DELETE CASCADE;


--
-- TOC entry 3952 (class 2606 OID 16705)
-- Name: msg_user_presence msg_user_presence_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.msg_user_presence
    ADD CONSTRAINT msg_user_presence_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.core_users(user_id) ON DELETE CASCADE;


--
-- TOC entry 4019 (class 2606 OID 17496)
-- Name: review_comment_reactions review_comment_reactions_comment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.review_comment_reactions
    ADD CONSTRAINT review_comment_reactions_comment_id_fkey FOREIGN KEY (comment_id) REFERENCES public.review_comments(comment_id) ON DELETE CASCADE;


--
-- TOC entry 4020 (class 2606 OID 17501)
-- Name: review_comment_reactions review_comment_reactions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.review_comment_reactions
    ADD CONSTRAINT review_comment_reactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.core_users(user_id);


--
-- TOC entry 4011 (class 2606 OID 17410)
-- Name: review_comments review_comments_review_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.review_comments
    ADD CONSTRAINT review_comments_review_id_fkey FOREIGN KEY (review_id) REFERENCES public.review_main(review_id);


--
-- TOC entry 4012 (class 2606 OID 17415)
-- Name: review_comments review_comments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.review_comments
    ADD CONSTRAINT review_comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.core_users(user_id);


--
-- TOC entry 3976 (class 2606 OID 17035)
-- Name: review_groups review_groups_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.review_groups
    ADD CONSTRAINT review_groups_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.core_users(user_id);


--
-- TOC entry 3977 (class 2606 OID 17058)
-- Name: review_main review_main_entity_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.review_main
    ADD CONSTRAINT review_main_entity_id_fkey FOREIGN KEY (entity_id) REFERENCES public.core_entities(entity_id) ON DELETE CASCADE;


--
-- TOC entry 3978 (class 2606 OID 17053)
-- Name: review_main review_main_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.review_main
    ADD CONSTRAINT review_main_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.core_users(user_id) ON DELETE CASCADE;


--
-- TOC entry 4013 (class 2606 OID 17430)
-- Name: review_reactions review_reactions_review_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.review_reactions
    ADD CONSTRAINT review_reactions_review_id_fkey FOREIGN KEY (review_id) REFERENCES public.review_main(review_id);


--
-- TOC entry 4014 (class 2606 OID 17435)
-- Name: review_reactions review_reactions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.review_reactions
    ADD CONSTRAINT review_reactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.core_users(user_id);


--
-- TOC entry 3966 (class 2606 OID 16903)
-- Name: review_templates review_templates_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.review_templates
    ADD CONSTRAINT review_templates_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.core_users(user_id) ON DELETE SET NULL;


--
-- TOC entry 3967 (class 2606 OID 16898)
-- Name: review_templates review_templates_unified_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.review_templates
    ADD CONSTRAINT review_templates_unified_category_id_fkey FOREIGN KEY (unified_category_id) REFERENCES public.unified_categories(id);


--
-- TOC entry 4015 (class 2606 OID 17451)
-- Name: review_versions review_versions_review_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.review_versions
    ADD CONSTRAINT review_versions_review_id_fkey FOREIGN KEY (review_id) REFERENCES public.review_main(review_id) ON DELETE CASCADE;


--
-- TOC entry 4016 (class 2606 OID 17456)
-- Name: review_versions review_versions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.review_versions
    ADD CONSTRAINT review_versions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.core_users(user_id);


--
-- TOC entry 4017 (class 2606 OID 17472)
-- Name: review_views review_views_review_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.review_views
    ADD CONSTRAINT review_views_review_id_fkey FOREIGN KEY (review_id) REFERENCES public.review_main(review_id);


--
-- TOC entry 4018 (class 2606 OID 17477)
-- Name: review_views review_views_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.review_views
    ADD CONSTRAINT review_views_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.core_users(user_id);


--
-- TOC entry 3998 (class 2606 OID 17283)
-- Name: search_analytics search_analytics_clicked_entity_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.search_analytics
    ADD CONSTRAINT search_analytics_clicked_entity_id_fkey FOREIGN KEY (clicked_entity_id) REFERENCES public.core_entities(entity_id) ON DELETE SET NULL;


--
-- TOC entry 3999 (class 2606 OID 17278)
-- Name: search_analytics search_analytics_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.search_analytics
    ADD CONSTRAINT search_analytics_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.core_users(user_id) ON DELETE SET NULL;


--
-- TOC entry 3969 (class 2606 OID 16941)
-- Name: social_circle_blocks social_circle_blocks_blocked_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.social_circle_blocks
    ADD CONSTRAINT social_circle_blocks_blocked_user_id_fkey FOREIGN KEY (blocked_user_id) REFERENCES public.core_users(user_id) ON DELETE CASCADE;


--
-- TOC entry 3970 (class 2606 OID 16936)
-- Name: social_circle_blocks social_circle_blocks_blocker_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.social_circle_blocks
    ADD CONSTRAINT social_circle_blocks_blocker_id_fkey FOREIGN KEY (blocker_id) REFERENCES public.core_users(user_id) ON DELETE CASCADE;


--
-- TOC entry 3971 (class 2606 OID 16968)
-- Name: social_circle_members social_circle_members_member_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.social_circle_members
    ADD CONSTRAINT social_circle_members_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.core_users(user_id) ON DELETE CASCADE;


--
-- TOC entry 3972 (class 2606 OID 16963)
-- Name: social_circle_members social_circle_members_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.social_circle_members
    ADD CONSTRAINT social_circle_members_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.core_users(user_id) ON DELETE CASCADE;


--
-- TOC entry 3973 (class 2606 OID 16996)
-- Name: social_circle_requests social_circle_requests_recipient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.social_circle_requests
    ADD CONSTRAINT social_circle_requests_recipient_id_fkey FOREIGN KEY (recipient_id) REFERENCES public.core_users(user_id) ON DELETE CASCADE;


--
-- TOC entry 3974 (class 2606 OID 16991)
-- Name: social_circle_requests social_circle_requests_requester_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.social_circle_requests
    ADD CONSTRAINT social_circle_requests_requester_id_fkey FOREIGN KEY (requester_id) REFERENCES public.core_users(user_id) ON DELETE CASCADE;


--
-- TOC entry 3936 (class 2606 OID 16494)
-- Name: unified_categories unified_categories_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.unified_categories
    ADD CONSTRAINT unified_categories_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.unified_categories(id) ON DELETE CASCADE;


--
-- TOC entry 3940 (class 2606 OID 16568)
-- Name: user_badges user_badges_badge_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.user_badges
    ADD CONSTRAINT user_badges_badge_id_fkey FOREIGN KEY (badge_id) REFERENCES public.badges(badge_id);


--
-- TOC entry 3941 (class 2606 OID 16563)
-- Name: user_badges user_badges_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.user_badges
    ADD CONSTRAINT user_badges_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.core_users(user_id);


--
-- TOC entry 3954 (class 2606 OID 16737)
-- Name: user_connections user_connections_target_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.user_connections
    ADD CONSTRAINT user_connections_target_user_id_fkey FOREIGN KEY (target_user_id) REFERENCES public.core_users(user_id) ON DELETE CASCADE;


--
-- TOC entry 3955 (class 2606 OID 16732)
-- Name: user_connections user_connections_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.user_connections
    ADD CONSTRAINT user_connections_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.core_users(user_id) ON DELETE CASCADE;


--
-- TOC entry 3996 (class 2606 OID 17262)
-- Name: user_entity_views user_entity_views_entity_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.user_entity_views
    ADD CONSTRAINT user_entity_views_entity_id_fkey FOREIGN KEY (entity_id) REFERENCES public.core_entities(entity_id);


--
-- TOC entry 3997 (class 2606 OID 17257)
-- Name: user_entity_views user_entity_views_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.user_entity_views
    ADD CONSTRAINT user_entity_views_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.core_users(user_id);


--
-- TOC entry 3958 (class 2606 OID 16787)
-- Name: user_events user_events_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.user_events
    ADD CONSTRAINT user_events_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.core_users(user_id);


--
-- TOC entry 3953 (class 2606 OID 16720)
-- Name: user_profiles user_profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT user_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.core_users(user_id);


--
-- TOC entry 3960 (class 2606 OID 16817)
-- Name: user_progress user_progress_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.user_progress
    ADD CONSTRAINT user_progress_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.core_users(user_id) ON DELETE CASCADE;


--
-- TOC entry 3959 (class 2606 OID 16804)
-- Name: user_search_history user_search_history_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.user_search_history
    ADD CONSTRAINT user_search_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.core_users(user_id) ON DELETE CASCADE;


--
-- TOC entry 3956 (class 2606 OID 16756)
-- Name: user_sessions user_sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.core_users(user_id) ON DELETE CASCADE;


--
-- TOC entry 3957 (class 2606 OID 16771)
-- Name: user_settings user_settings_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.user_settings
    ADD CONSTRAINT user_settings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.core_users(user_id) ON DELETE CASCADE;


--
-- TOC entry 3963 (class 2606 OID 16851)
-- Name: weekly_engagement weekly_engagement_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.weekly_engagement
    ADD CONSTRAINT weekly_engagement_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.core_users(user_id) ON DELETE CASCADE;


--
-- TOC entry 3965 (class 2606 OID 16881)
-- Name: whats_next_goals whats_next_goals_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: reviewinn_user
--

ALTER TABLE ONLY public.whats_next_goals
    ADD CONSTRAINT whats_next_goals_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.core_users(user_id) ON DELETE CASCADE;


-- Completed on 2025-09-02 21:28:03 UTC

--
-- PostgreSQL database dump complete
--

\unrestrict pybVh3GoZHs2sbPdO3YMNDDuIM6f05yT1XvIfiYzbRorYEZOtFVaTly1UhnNCjD

